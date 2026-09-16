<?php

namespace Database\Seeders;

use App\Models\StudentType;
use Illuminate\Database\Seeder;

class StudentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $studentTypes = [
            [
                'name' => 'Regular',
                'code' => 'regular',
                'description' => 'Regular full-time students',
                'is_active' => true,
            ],
            [
                'name' => 'Winter',
                'code' => 'winter',
                'description' => 'Winter program students',
                'is_active' => true,
            ],
            [
                'name' => 'Summer',
                'code' => 'summer',
                'description' => 'Summer program students',
                'is_active' => true,
            ],
            [
                'name' => 'Extension/Weekend',
                'code' => 'extension',
                'description' => 'Extension and weekend program students',
                'is_active' => true,
            ],
        ];

        foreach ($studentTypes as $type) {
            StudentType::create($type);
        }
    }
}
