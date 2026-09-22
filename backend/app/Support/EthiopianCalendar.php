<?php

namespace App\Support;

/**
 * Ethiopian (Ethiopic) calendar conversion.
 *
 * The Ethiopic calendar has 13 months: 12 × 30 days + Pagume (5 or 6 days).
 * The year starts on Meskerem 1, which falls on September 11 (or 12 in the
 * year before a Gregorian leap year).
 *
 * The algorithm below is the well-known JDN-based conversion used widely
 * (Wikipedia "Ethiopian calendar" / Beyene-Kudlek). It is exact for all
 * modern dates.
 */
class EthiopianCalendar
{
    /** Ethiopic month names (English transliteration). */
    public const MONTHS = [
        'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
        'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume',
    ];

    /**
     * Convert a Gregorian date to Ethiopic {year, month, day}.
     */
    public static function fromGregorian(\DateTimeInterface $date): array
    {
        $jd = self::gregorianToJdn(
            (int) $date->format('Y'),
            (int) $date->format('n'),
            (int) $date->format('j')
        );

        return self::fromJdn($jd);
    }

    /**
     * Gregorian calendar date → Julian Day Number.
     *
     * Fliegel–Van Flandern integer formula (used by PHP's own
     * gregoriantojd), implemented in pure PHP so we don't depend on the
     * optional calendar extension, which is missing on Railway.
     */
    private static function gregorianToJdn(int $y, int $m, int $d): int
    {
        $a = intdiv($m - 14, 12);

        return intdiv(1461 * ($y + 4800 + $a), 4)
            + intdiv(367 * ($m - 2 - 12 * $a), 12)
            - intdiv(3 * intdiv($y + 4900 + $a, 100), 4)
            + $d - 32075;
    }

    /**
     * JDN → Ethiopic date (Beyene–Kudlek algorithm).
     */
    public static function fromJdn(int $jd): array
    {
        $r = ($jd - 1723856) % 1461;
        $n = ($r % 365) + 365 * (int) ($r / 1460);

        $year = 4 * (int) (($jd - 1723856) / 1461)
              + (int) ($r / 365) - (int) ($r / 1460);
        $month = (int) ($n / 30) + 1;
        $day = ($n % 30) + 1;

        return [
            'year'  => $year,
            'month' => $month,
            'day'   => $day,
        ];
    }

    /**
     * Ethiopic year for a Gregorian date.
     */
    public static function year(\DateTimeInterface $date): int
    {
        return self::fromGregorian($date)['year'];
    }

    /**
     * Current Ethiopic year.
     */
    public static function currentYear(): int
    {
        return self::year(new \DateTimeImmutable('now'));
    }

    /**
     * Ethiopic month name for a Gregorian date, e.g. "Meskerem".
     */
    public static function monthName(\DateTimeInterface $date): string
    {
        $m = self::fromGregorian($date)['month'];

        return self::MONTHS[$m - 1] ?? '';
    }

    /**
     * Format a Gregorian date in the Ethiopian calendar,
     * e.g. "Meskerem 12, 2019 EC" or with format "d/m/Y" → "12/01/2019".
     */
    public static function format(\DateTimeInterface $date, string $format = 'F j, Y'): string
    {
        $ec = self::fromGregorian($date);

        $replacements = [
            'F' => self::MONTHS[$ec['month'] - 1],
            'j' => (string) $ec['day'],
            'd' => sprintf('%02d', $ec['day']),
            'n' => (string) $ec['month'],
            'm' => sprintf('%02d', $ec['month']),
            'Y' => (string) $ec['year'],
        ];

        // strtr performs all replacements in a single pass, so characters
        // inside substituted values (e.g. the 'm' in "Meskerem") are not
        // re-processed by later replacements.
        return strtr($format, $replacements);
    }

    /**
     * Default academic-year / batch value used across the system, e.g. "2019".
     */
    public static function academicYear(): string
    {
        return (string) self::currentYear();
    }

    /**
     * Normalize a year value to the Ethiopian calendar.
     *
     * Values that are clearly Gregorian (greater than the current EC year,
     * e.g. 2020+ while we are in EC 2019 — note EC 2020 only begins in Sep 2027)
     * are converted assuming the university's main September intake: EC = GC − 7.
     * Values that can only be Ethiopian years (≤ current EC) pass through untouched.
     *
     * Returns null when the value is not a plausible year.
     */
    public static function normalizeYear($value): ?int
    {
        $year = is_int($value) ? $value : (int) trim((string) $value);
        if ($year < 1900 || $year > 2200) {
            return null;
        }

        $ec = self::currentYear();
        if ($year > $ec) {
            return $year - 7;
        }

        return $year;
    }

    /**
     * Normalize a free-form academic-year string ("2019", "2019/20", "2019 E.C.").
     * Bare Gregorian years and "GC/YY" pairs are converted to Ethiopian years;
     * anything else is returned as entered.
     */
    public static function normalizeAcademicYearString(?string $value): ?string
    {
        $v = trim((string) $value);
        if ($v === '') {
            return null;
        }

        if (preg_match('/^\d{4}$/', $v)) {
            $y = self::normalizeYear((int) $v);

            return $y !== null ? (string) $y : null;
        }

        // "2026/27" or "2026/2027" style pairs
        if (preg_match('/^(\d{4})\s*\/\s*(\d{2,4})$/', $v, $m)) {
            $y = self::normalizeYear((int) $m[1]);
            if ($y !== null && $y !== (int) $m[1]) {
                return $y . '/' . sprintf('%02d', ($y + 1) % 100);
            }

            return $m[1] . '/' . $m[2];
        }

        return $v;
    }
}
