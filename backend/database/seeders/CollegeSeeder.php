<?php

namespace Database\Seeders;

use App\Models\College;
use Illuminate\Database\Seeder;

class CollegeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $colleges = [
            [
                'name' => 'College of Natural and Computational Sciences',
                'code' => 'CNCS',
                'description' => 'Natural and computational sciences programs',
                'is_active' => true,
            ],
            [
                'name' => 'College of Business and Economics',
                'code' => 'CBE',
                'description' => 'Business and economics programs',
                'is_active' => true,
            ],
            [
                'name' => 'College of Social Sciences and Humanities',
                'code' => 'CSSH',
                'description' => 'Social sciences and humanities programs',
                'is_active' => true,
            ],
            [
                'name' => 'College of Engineering and Technology',
                'code' => 'CET',
                'description' => 'Engineering and technology programs',
                'is_active' => true,
            ],
        ];

        foreach ($colleges as $college) {
            College::firstOrCreate(['code' => $college['code']], $college);
        }
    }
}
