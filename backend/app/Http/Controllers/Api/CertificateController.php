<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
use App\Models\ClearanceRequest;
use App\Models\Student;
use App\Models\Setting;
use Illuminate\Http\Request;
use Exception;

class CertificateController extends Controller
{
    /**
     * Get all certificates with filters
     */
    public function index(Request $request)
    {
        $query = Certificate::with([
            'clearanceRequest.student.department',
            'clearanceRequest.student.program',
            'clearanceRequest.student.studentType',
            'issuedBy',
        ]);

        // Filter by student
        if ($request->filled('student_id')) {
            $query->whereHas('clearanceRequest.student', function ($q) use ($request) {
                $q->where('id', $request->student_id);
            });
        }

        // Filter by department
        if ($request->filled('department_id')) {
            $query->whereHas('clearanceRequest.student', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('issued_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('issued_date', '<=', $request->to_date);
        }

        // Department-based authorization for officers
        $user = $request->user();
        if ($user->department_id && !$user->hasRole('admin')) {
            $query->whereHas('clearanceRequest.student', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        }

        $certificates = $query->orderBy('issued_date', 'desc')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => CertificateResource::collection($certificates),
            'meta' => [
                'current_page' => $certificates->currentPage(),
                'last_page' => $certificates->lastPage(),
                'per_page' => $certificates->perPage(),
                'total' => $certificates->total(),
            ],
        ]);
    }

    /**
     * Get a single certificate
     */
    public function show($id)
    {
        $certificate = Certificate::with([
            'clearanceRequest.student.department.college',
            'clearanceRequest.student.program',
            'clearanceRequest.student.studentType',
            'clearanceRequest.clearanceItems.clearanceOffice',
            'clearanceRequest.clearanceItems.processedBy',
            'issuedBy',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new CertificateResource($certificate),
        ]);
    }

    /**
     * Download certificate as a simple HTML page (for PDF rendering)
     */
    public function download($id)
    {
        $certificate = Certificate::with([
            'clearanceRequest.student.department.college',
            'clearanceRequest.student.program',
            'clearanceRequest.student.studentType',
            'clearanceRequest.clearanceItems.clearanceOffice',
            'clearanceRequest.clearanceItems.processedBy',
            'issuedBy',
        ])->findOrFail($id);

        $student = $certificate->clearanceRequest->student;
        $clearanceRequest = $certificate->clearanceRequest;
        $verificationUrl = url("/api/verify/{$certificate->verification_code}");

        $html = $this->generateCertificateHtml($certificate, $student, $clearanceRequest, $verificationUrl);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Content-Disposition' => 'inline; filename="certificate-' . $certificate->certificate_number . '.html"',
        ]);
    }

    /**
     * Public certificate view (no authentication required)
     * Used for viewing and printing certificates
     */
    public function publicView($id)
    {
        $certificate = Certificate::with([
            'clearanceRequest.student.department.college',
            'clearanceRequest.student.program',
            'clearanceRequest.student.studentType',
            'clearanceRequest.clearanceItems.clearanceOffice',
            'issuedBy',
        ])->findOrFail($id);

        $student = $certificate->clearanceRequest->student;
        $clearanceRequest = $certificate->clearanceRequest;
        $verificationUrl = url("/api/verify/{$certificate->verification_code}");

        $html = $this->generateCertificateHtml($certificate, $student, $clearanceRequest, $verificationUrl);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
        ]);
    }

    /**
     * Get student's certificate (for student role)
     */
    public function myCertificate(Request $request)
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student profile not found',
            ], 404);
        }

        $certificates = Certificate::whereHas('clearanceRequest', function ($q) use ($student) {
            $q->where('student_id', $student->id)
                ->where('status', 'completed');
        })
            ->with([
                'clearanceRequest.student.department.college',
                'clearanceRequest.student.program',
                'clearanceRequest.student.studentType',
                'issuedBy',
            ])
            ->orderBy('issued_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => CertificateResource::collection($certificates),
        ]);
    }

    /**
     * Generate certificate HTML
     */
    protected function generateCertificateHtml($certificate, $student, $clearanceRequest, $verificationUrl)
    {
        $college = $student->department ? ($student->department->college ? $student->department->college->name : 'N/A') : 'N/A';
        $department = $student->department ? $student->department->name : 'N/A';
        $program = $student->program ? $student->program->name : 'N/A';
        $studentType = $student->studentType ? $student->studentType->name : 'N/A';
        $studentFullName = trim(implode(' ', array_filter([
            $student->first_name,
            $student->middle_name,
            $student->last_name,
        ])));
        $reasonLabels = [
            'end_of_semester' => 'End of Semester / Academic Year',
            'withdrawal' => 'Withdrawal',
            'academic_dismissal' => 'Academic Dismissal',
            'graduation' => 'Graduation',
            'other' => 'Other',
        ];
        $reason = $reasonLabels[$clearanceRequest->reason_for_clearance] ?? 'N/A';
        if ($clearanceRequest->reason_for_clearance === 'other' && $clearanceRequest->reason_other) {
            $reason .= ': ' . $clearanceRequest->reason_other;
        }
        $studentTypeCode = strtolower($studentType);
        $programRegular = strpos($studentTypeCode, 'regular') !== false && strpos($studentTypeCode, 'extension') === false;
        $programExtension = strpos($studentTypeCode, 'extension') !== false;
        $programSummer = strpos($studentTypeCode, 'summer') !== false;
        $programRegularInService = strpos($studentTypeCode, 'regular in-service') !== false;
        $programWinterInService = strpos($studentTypeCode, 'winter') !== false;
        $checkbox = function ($checked) {
            return $checked ? '&#9745;' : '&#9744;';
        };
        $programOptions = implode(' &nbsp; ', [
            $checkbox($programRegular) . ' Regular',
            $checkbox($programExtension) . ' Extension',
            $checkbox($programSummer) . ' Summer',
            $checkbox($programRegularInService) . ' Regular in-service',
            $checkbox($programWinterInService) . ' Winter in-service',
        ]);
        $reasonCheckboxes = implode(' &nbsp; ', [
            $checkbox($clearanceRequest->reason_for_clearance === 'end_of_semester') . ' End of semester / Academic Year',
            $checkbox($clearanceRequest->reason_for_clearance === 'withdrawal') . ' Withdrawal',
            $checkbox($clearanceRequest->reason_for_clearance === 'academic_dismissal') . ' Academic Dismissal',
            $checkbox($clearanceRequest->reason_for_clearance === 'graduation') . ' Graduation',
            $checkbox($clearanceRequest->reason_for_clearance === 'other') . ' Other: ' . ($clearanceRequest->reason_other ?: '________________'),
        ]);
        $universityName = Setting::get('university_name', 'Madda Walabu University');
        $systemName = Setting::get('system_name', 'Student Clearance Management System');
        // Use dynamic logo URL (serves custom or default PNG)
        $logoUrl = url('/api/logo');
        $stampUrl = Setting::get('stamp_path') ? url('/api/stamp') : null;
        $stampMarkup = $stampUrl
            ? "<img src='{$stampUrl}' alt='Official university stamp'/>"
            : "<div class='seal-fallback'>OFFICIAL<br/>STAMP</div>";
        
        // Generate QR code URL using external API (no imagick required)
        $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' . urlencode($verificationUrl);

        $items = '';
        foreach ($clearanceRequest->clearanceItems as $item) {
            $officeName = $item->clearanceOffice ? $item->clearanceOffice->name : 'N/A';
            $processedByName = $item->processedBy ? $item->processedBy->name : 'N/A';
            $statusLabel = $item->status === 'approved'
                ? 'Approved'
                : ucfirst(str_replace('_', ' ', $item->status));
            $processedDate = $item->processed_at
                ? $item->processed_at->format('F d, Y')
                : 'N/A';

            $items .= "<tr>
                <td style='padding:5px 8px;border:1px solid #222;text-align:center;'>{$item->step_order}.</td>
                <td style='padding:5px 8px;border:1px solid #222;'>{$officeName}</td>
                <td style='padding:5px 8px;border:1px solid #222;'>{$processedByName}</td>
                <td style='padding:5px 8px;border:1px solid #222;text-align:center;'>{$statusLabel}</td>
                <td style='padding:5px 8px;border:1px solid #222;text-align:center;'>{$processedDate}</td>
            </tr>";
        }

        $issuedDate = $certificate->issued_date ? $certificate->issued_date->format('F d, Y') : 'N/A';

        $html = "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Clearance Certificate - {$certificate->certificate_number}</title>
    <style>
            'clearanceRequest.clearanceItems.clearanceOffice',
            'clearanceRequest.clearanceItems.processedBy',
            body { margin: 0; padding: 0; background: #fff; }
            .certificate { box-shadow: none !important; }
            .no-print { display: none !important; }
            @page { size: A4 portrait; margin: 0; }
        }
        @page {
            size: A4 portrait;
            margin: 0;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            margin: 0;
            padding: 7mm;
            background: #eef1f6;
            color: #182235;
        }
        .certificate {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: #fff;
            position: relative;
            padding: 0;
            overflow: hidden;
            page-break-inside: avoid;
            box-shadow: 0 12px 35px rgba(18, 38, 74, .16);
        }
        .border-outer {
            border: 1px solid #c9d2e3;
            padding: 7px;
            height: 100%;
        }
        .border-inner {
            border: 2px solid #042791;
            padding: 0;
            height: calc(100% - 8px);
        }
        .cert-header {
            position: relative;
            text-align: center;
            padding: 14px 30px 11px;
            border-bottom: 4px solid #d5a72c;
            background: #f8faff;
        }
        .logo-container {
            margin: 0 auto 6px;
            width: 62px;
            height: 62px;
        }
        .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .university-name {
            font-size: 19px;
            font-weight: bold;
            color: #042791;
            text-transform: uppercase;
            letter-spacing: 0;
            margin: 0;
        }
        .subtitle {
            font-size: 12px;
            color: #37445b;
            margin-top: 5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        .cert-body {
            padding: 16px 27px 12px;
        }
        .cert-title {
            text-align: center;
            font-size: 25px;
            font-weight: bold;
            color: #042791;
            text-transform: uppercase;
            letter-spacing: 0;
            margin: 0;
            padding: 0 0 4px;
        }
        .cert-subtitle {
            text-align: center;
            font-size: 11px;
            color: #65728a;
            margin: 0 0 12px;
            font-style: italic;
        }
        .gold-divider {
            height: 2px;
            width: 72px;
            margin: 0 auto 12px;
            background: #d5a72c;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 14px;
            padding: 11px 12px;
            border: 1px solid #d9e1ef;
            border-left: 4px solid #042791;
            background: #fbfcff;
        }
        .info-left {
            flex: 1;
        }
        .info-right {
            width: 116px;
            text-align: center;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px 6px;
            font-size: 11px;
            border-bottom: 0;
        }
        .info-label {
            font-weight: bold;
            color: #042791;
            width: 137px;
        }
        .info-value {
            color: #222;
        }
        .qr-code {
            border: 1px solid #cbd6e8;
            padding: 6px;
            background: #fff;
            border-radius: 4px;
        }
        .qr-code img {
            width: 100px;
            height: 100px;
        }
        .qr-label {
            font-size: 8px;
            color: #555;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .section-title {
            text-align: left;
            color: #042791;
            font-size: 13px;
            font-weight: bold;
            margin: 10px 0 6px;
            letter-spacing: 1px;
            text-transform: uppercase;
            border-bottom: 2px solid #d5a72c;
            padding-bottom: 5px;
        }
        .items-table {
            width: 100%;
            margin: 0 auto 14px;
            border-collapse: collapse;
            font-size: 10px;
        }
        .items-table th {
            background: #042791;
            color: #fff;
            padding: 7px 8px;
            border: 1px solid #042791;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items-table th:last-child {
            text-align: center;
        }
        .items-table td {
            padding: 7px 8px;
            border: 1px solid #d5deed;
            color: #333;
        }
        .footer {
            padding: 12px 27px 17px;
            border-top: 1px solid #cbd6e8;
            background: #f8faff;
        }
        .footer-content {
            display: block;
            text-align: center;
        }
        .signature-section {
            width: 100%;
        }
        .signature-row {
            display: flex;
            justify-content: space-around;
            margin-top: 12px;
        }
        .signature-block {
            text-align: center;
        }
        .signature-line {
            display: inline-block;
            width: 125px;
            border-top: 1px solid #71809a;
            padding-top: 5px;
            font-size: 10px;
            color: #37445b;
        }
        .seal-section {
            text-align: center;
            margin-top: 14px;
        }
        .seal {
            display: inline-block;
            width: 128px;
            height: 128px;
            text-align: center;
                'clearanceRequest.clearanceItems.clearanceOffice',
                'clearanceRequest.clearanceItems.processedBy',
            font-size: 8px;
            font-weight: bold;
        }
        .seal img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .seal-fallback {
            padding-top: 35px;
            line-height: 11px;
            font-size: 8px;
            color: #042791;
            font-weight: bold;
        }
        .verification-info {
            text-align: center;
            margin-top: 12px;
            padding: 8px;
            background: #eef3ff;
            border: 1px solid #c9d7f2;
            border-radius: 4px;
            font-size: 10px;
            color: #444;
        }
        .verification-code {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: bold;
            color: #042791;
            letter-spacing: 1px;
        }
        .print-btn {
            max-width: 210mm;
            margin: 8px auto;
            text-align: right;
        }
        .print-btn button {
            background: #042791;
            color: #fff;
            border: none;
            padding: 6px 16px;
            font-size: 12px;
            cursor: pointer;
            border-radius: 4px;
        }
        .print-btn button:hover {
            background: #031c6a;
        }
    </style>
</head>
<body>
    <div class='print-btn no-print'>
        <button onclick='window.print()'>Print / Save as PDF</button>
    </div>
    <div class='certificate'>
        <div class='border-outer'>
            <div class='border-inner'>
                <div class='cert-header'>
                    <div class='logo-container'>
                        <img src='{$logoUrl}' alt='MWU Logo'/>
                    </div>
                    <div class='university-name'>{$universityName}</div>
                    <div class='subtitle'>Registrar and Alumni Directorate</div>
                </div>

                <div class='cert-body'>
                    <div class='cert-title'>Student Clearance Form</div>
                    <div class='cert-subtitle' style='text-align:left;font-style:normal;color:#111;'>Program: {$programOptions}</div>
                    <div class='gold-divider'></div>

                    <div class='info-section'>
                        <div class='info-left'>
                            <table class='info-table'>
                                <tr><td class='info-label'>1. Full name:</td><td class='info-value'><strong>{$studentFullName}</strong></td></tr>
                                <tr><td class='info-label'>2. Id. No:</td><td class='info-value'>{$student->student_id}</td></tr>
                                <tr><td class='info-label'>3. School:</td><td class='info-value'>{$college}</td></tr>
                                <tr><td class='info-label'>4. Department:</td><td class='info-value'>{$department}</td></tr>
                                <tr><td class='info-label'>5. Program:</td><td class='info-value'>{$program}</td></tr>
                                <tr><td class='info-label'>6. Reason(s) for clearance:</td><td class='info-value'>{$reason}</td></tr>
                            </table>
                            <div style='font-size:11px;margin-top:4px;line-height:1.8;'>{$reasonCheckboxes}</div>
                        </div>
                        <div class='info-right'>
                            <div class='qr-code'>
                                <img src='{$qrCodeUrl}' alt='QR Code'/>
                                <div class='qr-label'>Scan to Verify</div>
                            </div>
                        </div>
                    </div>

                    <div class='section-title'>Clearance Approval</div>
                    <table class='items-table'>
                        <thead>
                            <tr>
                                <th style='width:7%;text-align:center;'>No.</th>
                                <th style='width:29%;'>Office</th>
                                <th style='width:25%;'>Name</th>
                                <th style='width:19%;text-align:center;'>Status</th>
                                <th style='width:20%;text-align:center;'>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {$items}
                        </tbody>
                    </table>
                </div>

                <div class='footer'>
                    <div class='footer-content'>
                        <div class='seal-section'>
                            <div class='seal'>{$stampMarkup}</div>
                        </div>
                    </div>
                    <div class='verification-info'>
                        <strong>Verification Code:</strong>
                        <span class='verification-code'>{$certificate->verification_code}</span><br>
                        <span style='font-size:10px;color:#888;'>Verify online at: {$verificationUrl}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>";

        return $html;
    }
}
