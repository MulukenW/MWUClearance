<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Support\EthiopianCalendar;

/**
 * Convert existing Gregorian years to the Ethiopian calendar.
 *
 * Students' academic_year / admission_year and clearance_requests.academic_year
 * previously defaulted to the Gregorian year (e.g. 2026, 2025/2026). This
 * migration normalizes them to Ethiopian-calendar years (e.g. 2019, 2019/20).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ---- students ----
        $students = DB::table('students')
            ->select('id', 'academic_year', 'admission_year')
            ->get();

        foreach ($students as $s) {
            $ay = EthiopianCalendar::normalizeAcademicYearString($s->academic_year);
            $admission = EthiopianCalendar::normalizeYear($s->admission_year);

            if ($ay !== $s->academic_year || ($admission !== null && (int) $admission !== (int) $s->admission_year)) {
                DB::table('students')
                    ->where('id', $s->id)
                    ->update([
                        'academic_year' => $ay,
                        'admission_year' => $admission ?? $s->admission_year,
                    ]);
            }
        }

        // ---- clearance_requests ----
        $requests = DB::table('clearance_requests')
            ->select('id', 'academic_year')
            ->get();

        foreach ($requests as $r) {
            $ay = EthiopianCalendar::normalizeAcademicYearString($r->academic_year);
            if ($ay !== $r->academic_year && $ay !== null) {
                DB::table('clearance_requests')
                    ->where('id', $r->id)
                    ->update(['academic_year' => $ay]);
            }
        }
    }

    public function down(): void
    {
        // One-way normalization: reversing would re-introduce Gregorian years.
    }
};
