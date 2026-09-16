<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Student;

class DepartmentAuthorizationMiddleware
{
    /**
     * Handle an incoming request.
     *
     * This middleware ensures users can only access students within their authorized department.
     * Administrators have access to all departments.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Admin can access everything
        if ($user->role && $user->role->code === 'admin') {
            return $next($request);
        }

        // Students can only access their own records
        if ($user->role && $user->role->code === 'student') {
            // Student access is handled separately in controllers
            return $next($request);
        }

        // For other roles, check department authorization
        // This will be used when accessing student records

        // If accessing a specific student, verify department access
        $studentId = $request->route('student') ?? $request->route('id') ?? $request->input('student_id');
        
        if ($studentId) {
            $student = Student::find($studentId);
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found',
                ], 404);
            }

            // Check if user has department assigned
            if (!$user->department_id) {
                // Users without department (like Library, Police, Registrar) can access all students
                return $next($request);
            }

            // Check if student belongs to user's department
            if ($student->department_id !== $user->department_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. You can only access students from your department.',
                    'your_department' => $user->department->name ?? 'None',
                    'student_department' => $student->department->name ?? 'Unknown',
                ], 403);
            }
        }

        return $next($request);
    }
}
