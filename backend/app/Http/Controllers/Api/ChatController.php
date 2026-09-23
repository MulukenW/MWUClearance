<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\ClearanceItem;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Exception;

class ChatController extends Controller
{
    /**
     * Steps where the conversation is open. This is what makes the chat
     * follow the workflow: a student talks to the office whose step is
     * currently pending / under review / rejected — never to locked or
     * future offices.
     */
    protected const OPEN_STATUSES = ['pending', 'under_review', 'rejected'];

    /**
     * Resolve a clearance item and verify the user may participate in its chat.
     *
     * Students: only on their own clearance requests.
     * Officers: only for items of their clearance office, scoped to their
     *           department when they have one (same rules as approving).
     * Admins:   supervisory access to everything.
     */
    protected function resolveItem($user, $itemId): ClearanceItem
    {
        $item = ClearanceItem::with(['clearanceRequest.student', 'clearanceOffice'])->findOrFail($itemId);

        if ($user->hasRole('admin')) {
            return $item;
        }

        if ($user->hasRole('student')) {
            $student = $item->clearanceRequest ? $item->clearanceRequest->student : null;
            if (!$student || $student->user_id !== $user->id) {
                abort(403, 'You are not authorized to access this conversation');
            }
            return $item;
        }

        // Officer
        if (!$user->clearance_office_id || $item->clearance_office_id !== $user->clearance_office_id) {
            abort(403, 'You are not authorized to access this conversation');
        }
        if ($user->department_id) {
            $student = $item->clearanceRequest ? $item->clearanceRequest->student : null;
            if ($student && $student->department_id && $student->department_id !== $user->department_id) {
                abort(403, 'You are not authorized to access this conversation');
            }
        } elseif ($user->college_id) {
            // College-scoped officers (e.g. Continuing Education) chat with
            // students from any department of their college.
            $student = $item->clearanceRequest ? $item->clearanceRequest->student : null;
            $studentCollegeId = ($student && $student->department) ? $student->department->college_id : null;
            if ($studentCollegeId && $studentCollegeId !== $user->college_id) {
                abort(403, 'You are not authorized to access this conversation');
            }
        }
        return $item;
    }

    /**
     * Chat is open only while the step is being worked on (or was rejected).
     */
    protected function isChatOpen(ClearanceItem $item): bool
    {
        return in_array($item->status, self::OPEN_STATUSES);
    }

    /**
     * GET /clearance/items/{itemId}/chat
     * Messages for one workflow step + metadata. Reading marks incoming messages read.
     */
    public function index(Request $request, $itemId)
    {
        try {
            $user = $request->user();
            $item = $this->resolveItem($user, $itemId);

            $messages = ChatMessage::where('clearance_item_id', $item->id)
                ->with('sender.role')
                ->orderBy('created_at')
                ->orderBy('id')
                ->get();

            // Mark the other party's messages as read
            ChatMessage::where('clearance_item_id', $item->id)
                ->where('sender_id', '!=', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            $student = $item->clearanceRequest ? $item->clearanceRequest->student : null;
            $office = $item->clearanceOffice;

            return response()->json([
                'success' => true,
                'data' => [
                    'messages' => $messages->map(function ($m) use ($user) {
                        return [
                            'id' => $m->id,
                            'message' => $m->message,
                            'is_mine' => $m->sender_id === $user->id,
                            'sender' => $m->sender ? [
                                'id' => $m->sender->id,
                                'name' => $m->sender->name,
                                'role' => $m->sender->role ? $m->sender->role->name : null,
                            ] : null,
                            'created_at' => $m->created_at ? $m->created_at->format('Y-m-d H:i:s') : null,
                            'read_at' => $m->read_at ? $m->read_at->format('Y-m-d H:i:s') : null,
                        ];
                    }),
                    'office' => $office ? ['id' => $office->id, 'name' => $office->name] : null,
                    'step_order' => $item->step_order,
                    'item_status' => $item->status,
                    'clearance_request_id' => $item->clearance_request_id,
                    'clearance_number' => $item->clearanceRequest ? $item->clearanceRequest->clearance_number : null,
                    'student_name' => $student ? trim($student->first_name . ' ' . $student->last_name) : null,
                    'can_send' => $this->isChatOpen($item),
                ],
            ], 200);
        } catch (Exception $e) {
            return $this->errorResponse($e);
        }
    }

    /**
     * POST /clearance/items/{itemId}/chat
     * Send a message. Blocked when the step is locked / approved / not required.
     */
    public function store(Request $request, $itemId)
    {
        try {
            $request->validate([
                'message' => 'required|string|max:2000',
            ]);

            $user = $request->user();
            $item = $this->resolveItem($user, $itemId);

            if (!$this->isChatOpen($item)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat is closed for this step. Conversations follow the clearance workflow — you can only chat while the step is pending, under review, or rejected.',
                ], 423);
            }

            $message = ChatMessage::create([
                'clearance_request_id' => $item->clearance_request_id,
                'clearance_item_id' => $item->id,
                'sender_id' => $user->id,
                'message' => $request->message,
            ]);

            $this->notifyRecipient($user, $item, $request->message);

            return response()->json([
                'success' => true,
                'message' => 'Message sent',
                'data' => [
                    'id' => $message->id,
                    'message' => $message->message,
                    'is_mine' => true,
                    'sender' => ['id' => $user->id, 'name' => $user->name],
                    'created_at' => $message->created_at ? $message->created_at->format('Y-m-d H:i:s') : null,
                    'read_at' => null,
                ],
            ], 201);
        } catch (Exception $e) {
            return $this->errorResponse($e);
        }
    }

    /**
     * GET /chat/threads — open conversations for the current user's role.
     */
    public function threads(Request $request)
    {
        try {
            $user = $request->user();

            $query = ClearanceItem::with(['clearanceOffice', 'clearanceRequest.student.department'])
                ->whereIn('status', self::OPEN_STATUSES)
                ->orderBy('updated_at', 'desc');

            if ($user->hasRole('student')) {
                $query->whereHas('clearanceRequest.student', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            } elseif (!$user->hasRole('admin')) {
                if (!$user->clearance_office_id) {
                    return response()->json(['success' => true, 'data' => []], 200);
                }
                $query->where('clearance_office_id', $user->clearance_office_id);
                if ($user->department_id) {
                    $query->whereHas('clearanceRequest.student', function ($q) use ($user) {
                        $q->where('department_id', $user->department_id);
                    });
                } elseif ($user->college_id) {
                    $query->whereHas('clearanceRequest.student.department', function ($q) use ($user) {
                        $q->where('college_id', $user->college_id);
                    });
                }
            }

            $threads = $query->limit(100)->get()->map(function ($item) use ($user) {
                $last = ChatMessage::where('clearance_item_id', $item->id)->orderBy('id', 'desc')->first();
                $unread = ChatMessage::where('clearance_item_id', $item->id)
                    ->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at')
                    ->count();
                $student = $item->clearanceRequest ? $item->clearanceRequest->student : null;
                $office = $item->clearanceOffice;

                return [
                    'item_id' => $item->id,
                    'step_order' => $item->step_order,
                    'item_status' => $item->status,
                    'office' => $office ? ['id' => $office->id, 'name' => $office->name] : null,
                    'clearance_request_id' => $item->clearance_request_id,
                    'clearance_number' => $item->clearanceRequest ? $item->clearanceRequest->clearance_number : null,
                    'student_name' => $student ? trim($student->first_name . ' ' . $student->last_name) : null,
                    'student_id_no' => $student ? $student->student_id : null,
                    'unread_count' => $unread,
                    'last_message' => $last ? [
                        'message' => $last->message,
                        'is_mine' => $last->sender_id === $user->id,
                        'sender_name' => $last->sender ? $last->sender->name : null,
                        'created_at' => $last->created_at ? $last->created_at->format('Y-m-d H:i:s') : null,
                    ] : null,
                ];
            });

            // Threads with recent messages first, untouched threads last
            $threads = $threads->sortByDesc(function ($t) {
                return $t['last_message'] ? $t['last_message']['created_at'] : '';
            })->values();

            return response()->json(['success' => true, 'data' => $threads], 200);
        } catch (Exception $e) {
            return $this->errorResponse($e);
        }
    }

    /**
     * POST /chat/messages/{id}/read — mark one incoming message as read.
     */
    public function markRead(Request $request, $id)
    {
        try {
            $user = $request->user();
            $message = ChatMessage::findOrFail($id);

            $this->resolveItem($user, $message->clearance_item_id);

            if ($message->sender_id !== $user->id) {
                $message->update(['read_at' => now()]);
            }

            return response()->json(['success' => true], 200);
        } catch (Exception $e) {
            return $this->errorResponse($e);
        }
    }

    /**
     * GET /chat/unread-count — badge for the sidebar / navbar.
     */
    public function unreadCount(Request $request)
    {
        try {
            $user = $request->user();

            $query = ChatMessage::where('sender_id', '!=', $user->id)->whereNull('read_at');

            if ($user->hasRole('student')) {
                $query->whereHas('clearanceRequest.student', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            } elseif (!$user->hasRole('admin')) {
                if (!$user->clearance_office_id) {
                    return response()->json(['success' => true, 'data' => ['unread_count' => 0]], 200);
                }
                $query->whereHas('clearanceItem', function ($q) use ($user) {
                    $q->where('clearance_office_id', $user->clearance_office_id);
                });
            }

            return response()->json([
                'success' => true,
                'data' => ['unread_count' => $query->count()],
            ], 200);
        } catch (Exception $e) {
            return $this->errorResponse($e);
        }
    }

    /**
     * Notify the other party in the workflow about a new chat message.
     */
    protected function notifyRecipient($sender, ClearanceItem $item, string $text): void
    {
        $office = $item->clearanceOffice;
        $officeName = $office ? $office->name : 'the office';
        $student = $item->clearanceRequest ? $item->clearanceRequest->student : null;
        $excerpt = mb_substr($text, 0, 80);

        if ($sender->hasRole('student')) {
            // Notify all active officers of the reviewing office who are
            // scoped to this student (department- or college-level).
            if (!$office) return;
            $officers = \App\Models\User::where('clearance_office_id', $office->id)
                ->where('status', 'active')
                ->get()
                ->filter(function ($officer) use ($student) {
                    if ($officer->department_id) {
                        return $student->department_id === $officer->department_id;
                    }
                    if ($officer->college_id) {
                        return $student->department && $student->department->college_id === $officer->college_id;
                    }
                    return true; // unscoped officer — sees everyone
                });
            foreach ($officers as $officer) {
                NotificationService::create(
                    $officer->id,
                    'chat_message',
                    'New Chat Message',
                    "{$student->full_name} sent you a message about their clearance: \"{$excerpt}\"",
                    [
                        'clearance_request_id' => $item->clearance_request_id,
                        'clearance_item_id' => $item->id,
                        'student_name' => $student->full_name,
                    ]
                );
            }
        } else {
            // Officer or admin replied — notify the student
            if (!$student || !$student->user_id) return;
            NotificationService::create(
                $student->user_id,
                'chat_message',
                'New Chat Message',
                "{$officeName} replied to your clearance chat: \"{$excerpt}\"",
                [
                    'clearance_request_id' => $item->clearance_request_id,
                    'clearance_item_id' => $item->id,
                ]
            );
        }
    }

    /**
     * Uniform error mapping (403/404/423 pass through).
     */
    protected function errorResponse(Exception $e)
    {
        if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
            $status = $e->getStatusCode();
        } elseif ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
            $status = 404;
        } else {
            $status = 500;
        }
        return response()->json([
            'success' => false,
            'message' => $status === 500 ? 'An error occurred' : $e->getMessage(),
            'error' => config('app.debug') ? $e->getMessage() : null,
        ], $status);
    }
}
