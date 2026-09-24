<?php

namespace Database\Seeders;

use App\Models\College;
use App\Models\Department;
use App\Models\Program;
use Illuminate\Database\Seeder;

class MwuAcademicStructureSeeder extends Seeder
{
    public function run()
    {
        $phdPrograms = [
            ['code' => 'CSSH', 'department' => 'English Language & Literature', 'name' => 'PhD in English Language Teaching'],
            ['code' => 'CBE',  'department' => 'Accounting & Finance', 'name' => 'PhD in Accounting and Finance'],
            ['code' => 'CNCS', 'department' => 'Chemistry', 'name' => 'PhD in Applied Microbiology'],
            ['code' => 'COED', 'department' => 'Educational Planning & Management', 'name' => 'PhD in Curriculum Design & Development'],
            ['code' => 'CSSH', 'department' => 'Geography & Environmental Studies', 'name' => 'PhD in Geography & Environmental Studies'],
            ['code' => 'CMHS', 'department' => 'School of Health Science', 'name' => 'PhD in Public Health'],
        ];

        $structure = [
            [
                'code' => 'CET',
                'name' => 'College of Engineering',
                'description' => 'College of Engineering',
                'departments' => [
                    ['name' => 'Civil Engineering', 'programs' => [
                        ['name' => 'Bachelor of Science in Civil Engineering', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Mechanical Engineering', 'programs' => [
                        ['name' => 'Bachelor of Science in Mechanical Engineering', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Mechanical Design', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Manufacturing System Engineering', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Water Resource & Irrigation Engineering', 'programs' => [
                        ['name' => 'Bachelor of Science in Water Resource & Irrigation Engineering', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Hydraulic Engineering', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Surveying Engineering', 'programs' => [
                        ['name' => 'Bachelor of Science in Surveying Engineering', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Electrical & Computer Engineering', 'programs' => [
                        ['name' => 'Bachelor of Science in Electrical & Computer Engineering', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Construction Technology & Management', 'programs' => [
                        ['name' => 'Bachelor of Science in Construction Technology & Management', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Engineering Drawing & Design', 'programs' => [
                        ['name' => 'Bachelor of Science in Engineering Drawing & Design', 'level' => 'undergraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'COC',
                'name' => 'College of Computing',
                'description' => 'College of Computing',
                'departments' => [
                    ['name' => 'Computer Science', 'programs' => [
                        ['name' => 'Computer Science', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Computer Science', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Information System', 'programs' => [
                        ['name' => 'Information System', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Information Science', 'programs' => [
                        ['name' => 'Information Science', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Information Technology', 'programs' => [
                        ['name' => 'Information Technology', 'level' => 'undergraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'CNCS',
                'name' => 'College of Natural & Computational Science',
                'description' => 'College of Natural & Computational Science',
                'departments' => [
                    ['name' => 'Mathematics', 'programs' => [
                        ['name' => 'Mathematics', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Mathematics (General)', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Mathematics (Specialization)', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Statistics', 'programs' => [
                        ['name' => 'Statistics', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Physics', 'programs' => [
                        ['name' => 'Physics', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Physics (General)', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Physics (Specialization)', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Chemistry', 'programs' => [
                        ['name' => 'Chemistry', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Chemistry', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Organic Chemistry', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Analytical Chemistry', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Applied Microbiology', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Biology', 'programs' => [
                        ['name' => 'Biology', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Biology', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Botanical Science', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Environmental Science', 'programs' => [
                        ['name' => 'Environmental Science', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Environmental Science', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Sport Science', 'programs' => [
                        ['name' => 'Sport Science', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Sport Science', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Football Coaching', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Athletics Coaching', 'level' => 'postgraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'CANR',
                'name' => 'College of Agriculture and Natural Resource',
                'description' => 'College of Agriculture and Natural Resource',
                'departments' => [
                    ['name' => 'Agricultural Economics', 'programs' => [
                        ['name' => 'Agricultural Economics', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Animal Science', 'programs' => [
                        ['name' => 'Animal Science', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Animal Production', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Biodiversity Conservation & Ecotourism', 'programs' => [
                        ['name' => 'Biodiversity Conservation & Ecotourism', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Ecosystem & Biodiversity Conservation', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Forestry', 'programs' => [
                        ['name' => 'Forestry', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Natural Resource Management', 'programs' => [
                        ['name' => 'Natural Resource Management', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Watershed Management', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Plant Science', 'programs' => [
                        ['name' => 'Plant Science', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Plant Pathology', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Agronomy', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Rural Development & Agricultural Extension', 'programs' => [
                        ['name' => 'Rural Development & Agricultural Extension', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Rural Development', 'level' => 'postgraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'CSSH',
                'name' => 'College of Social Science & Humanities',
                'description' => 'College of Social Science & Humanities',
                'departments' => [
                    ['name' => 'Afan Oromo & Literature', 'programs' => [
                        ['name' => 'Afan Oromo & Literature', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Afan Oromo & Literature', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Amharic Language & Literature', 'programs' => [
                        ['name' => 'Amharic Language & Literature', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Applied Linguistics & Teaching Amharic', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Civics & Ethical Studies', 'programs' => [
                        ['name' => 'Civics & Ethical Studies', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Civics & Ethical Studies', 'level' => 'postgraduate'],
                        ['name' => 'Master of Arts in Governance & Developmental Studies', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Journalism & Communication', 'programs' => [
                        ['name' => 'Journalism & Communication', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'English Language & Literature', 'programs' => [
                        ['name' => 'English Language & Literature', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Teaching English as Foreign Language', 'level' => 'postgraduate'],
                        ['name' => 'Master of Arts in General Linguistic', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Geography & Environmental Studies', 'programs' => [
                        ['name' => 'Geography & Environmental Studies', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Geography & Environmental Studies', 'level' => 'postgraduate'],
                        ['name' => 'Master of Arts in Urban Planning & Management', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Geographic Information System Land Planning & Management', 'level' => 'postgraduate'],
                        ['name' => 'Master of Arts in Climate Change Disaster & Risk Management', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Sociology', 'programs' => [
                        ['name' => 'Sociology', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'History & Heritage Management', 'programs' => [
                        ['name' => 'History & Heritage Management', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in History & Heritage Studies', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'GIS', 'programs' => [
                        ['name' => 'GIS', 'level' => 'undergraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'CBE',
                'name' => 'College of Business & Economics',
                'description' => 'College of Business & Economics',
                'departments' => [
                    ['name' => 'Management', 'programs' => [
                        ['name' => 'Management', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Business Administration', 'level' => 'postgraduate'],
                        ['name' => 'Master of Arts in Business Education', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Accounting & Finance', 'programs' => [
                        ['name' => 'Accounting & Finance', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Accounting & Finance', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Economics', 'programs' => [
                        ['name' => 'Economics', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Developmental Economics', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Marketing Management', 'programs' => [
                        ['name' => 'Marketing Management', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Marketing Management', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Tourism & Hotel Management', 'programs' => [
                        ['name' => 'Tourism & Hotel Management', 'level' => 'undergraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'COED',
                'name' => 'College of Education & Behavioral Studies',
                'description' => 'College of Education & Behavioral Studies',
                'departments' => [
                    ['name' => 'Educational Planning & Management', 'programs' => [
                        ['name' => 'Educational Planning & Management', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Curriculum & Teachers Profession', 'level' => 'postgraduate'],
                        ['name' => 'Master of Arts in Educational Planning & Management', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Lifelong Learning & Community Development', 'programs' => [
                        ['name' => 'Lifelong Learning & Community Development', 'level' => 'undergraduate'],
                    ]],
                    ['name' => 'Psychology', 'programs' => [
                        ['name' => 'Psychology', 'level' => 'undergraduate'],
                        ['name' => 'Master of Arts in Developmental Psychology', 'level' => 'postgraduate'],
                        ['name' => 'Master of Arts in Educational Psychology', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'Early Childhood Care & Education', 'programs' => [
                        ['name' => 'Early Childhood Care & Education', 'level' => 'undergraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'CMHS',
                'name' => 'College of Medicine & Health Science',
                'description' => 'College of Medicine & Health Science - Goba Campus',
                'departments' => [
                    ['name' => 'School of Medicine', 'programs' => [
                        ['name' => 'Medicine', 'level' => 'undergraduate'],
                        ['name' => 'Pharmacy', 'level' => 'undergraduate'],
                        ['name' => 'Medical Laboratory', 'level' => 'undergraduate'],
                        ['name' => 'Specialty in Surgery', 'level' => 'postgraduate'],
                    ]],
                    ['name' => 'School of Health Science', 'programs' => [
                        ['name' => 'Nursing', 'level' => 'undergraduate'],
                        ['name' => 'Midwifery', 'level' => 'undergraduate'],
                        ['name' => 'Public Health', 'level' => 'undergraduate'],
                        ['name' => 'Master of Science in Public Health & Epidemiology', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Adult Health Nursing', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in General Public Health', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Maternity & Reproductive Health', 'level' => 'postgraduate'],
                        ['name' => 'Master of Science in Reproductive Public Health', 'level' => 'postgraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'LAW',
                'name' => 'School of Law',
                'description' => 'School of Law',
                'departments' => [
                    ['name' => 'School of Law', 'programs' => [
                        ['name' => 'Law', 'level' => 'undergraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'CBE-SHC',
                'name' => 'College of Business & Economics (Shashamane Campus)',
                'description' => 'College of Business & Economics - Shashamane Campus',
                'departments' => [
                    ['name' => 'Management', 'programs' => [['name' => 'Management', 'level' => 'undergraduate']]],
                    ['name' => 'Accounting & Finance', 'programs' => [['name' => 'Accounting & Finance', 'level' => 'undergraduate']]],
                    ['name' => 'Economics', 'programs' => [['name' => 'Economics', 'level' => 'undergraduate']]],
                    ['name' => 'Marketing Management', 'programs' => [['name' => 'Marketing Management', 'level' => 'undergraduate']]],
                    ['name' => 'Tourism & Hotel Management', 'programs' => [['name' => 'Tourism & Hotel Management', 'level' => 'undergraduate']]],
                ],
            ],
            [
                'code' => 'SHCS-SHC',
                'name' => 'School of Health Science (Shashamane Campus)',
                'description' => 'School of Health Science - Shashamane Campus',
                'departments' => [
                    ['name' => 'School of Health Science', 'programs' => [
                        ['name' => 'Nursing', 'level' => 'undergraduate'],
                        ['name' => 'Midwifery', 'level' => 'undergraduate'],
                        ['name' => 'Public Health', 'level' => 'undergraduate'],
                    ]],
                ],
            ],
            [
                'code' => 'CSSH-SHC',
                'name' => 'College of Social Science & Humanities (Shashamane Campus)',
                'description' => 'College of Social Science & Humanities - Shashamane Campus',
                'departments' => [
                    ['name' => 'Afan Oromo & Literature', 'programs' => [['name' => 'Afan Oromo & Literature', 'level' => 'undergraduate']]],
                    ['name' => 'Civics & Ethical Studies', 'programs' => [['name' => 'Civics & Ethical Studies', 'level' => 'undergraduate']]],
                    ['name' => 'English Language & Literature', 'programs' => [['name' => 'English Language & Literature', 'level' => 'undergraduate']]],
                    ['name' => 'Geography & Environmental Studies', 'programs' => [['name' => 'Geography & Environmental Studies', 'level' => 'undergraduate']]],
                    ['name' => 'History & Heritage Management', 'programs' => [['name' => 'History & Heritage Management', 'level' => 'undergraduate']]],
                    ['name' => 'Law', 'programs' => [['name' => 'Law', 'level' => 'undergraduate']]],
                ],
            ],
        ];

        foreach ($structure as $collegeData) {
            $college = College::updateOrCreate(
                ['code' => $collegeData['code']],
                [
                    'name' => $collegeData['name'],
                    'description' => $collegeData['description'] ?? null,
                    'is_active' => $collegeData['is_active'] ?? true,
                ]
            );

            foreach ($collegeData['departments'] as $deptData) {
                $department = Department::updateOrCreate(
                    ['name' => $deptData['name'], 'college_id' => $college->id],
                    [
                        'code' => $collegeData['code'] . '-' . $this->abbr($deptData['name']),
                        'description' => $deptData['description'] ?? null,
                        'is_active' => $deptData['is_active'] ?? true,
                    ]
                );

                foreach ($deptData['programs'] as $prog) {
                    Program::updateOrCreate(
                        ['name' => $prog['name'], 'department_id' => $department->id],
                        [
                            'code' => $collegeData['code'] . '-' . $this->abbr($prog['name']),
                            'description' => $prog['description'] ?? null,
                            'level' => $prog['level'],
                            'duration_years' => $prog['duration_years'] ?? $this->defaultDuration($prog['level']),
                            'is_active' => $prog['is_active'] ?? true,
                        ]
                    );
                }
            }
        }

        foreach ($phdPrograms as $phd) {
            $college = College::where('code', $phd['code'])->first();
            if (!$college) {
                continue;
            }
            $department = Department::firstOrCreate(
                ['name' => $phd['department'], 'college_id' => $college->id],
                ['code' => $phd['code'] . '-' . $this->abbr($phd['department'])]
            );
            Program::updateOrCreate(
                ['name' => $phd['name'], 'department_id' => $department->id],
                [
                    'code' => $phd['code'] . '-' . $this->abbr($phd['name']),
                    'level' => 'phd',
                    'duration_years' => $phd['duration_years'] ?? 3,
                    'is_active' => true,
                ]
            );
        }
    }

    protected function abbr($name)
    {
        $stop = ['of', 'and', 'in', 'for', 'the', 'to'];
        $words = preg_split('/[\s&]+/', trim((string) $name));
        $parts = [];
        foreach ($words as $word) {
            $word = trim($word);
            if ($word === '') {
                continue;
            }
            if (in_array(strtolower($word), $stop, true)) {
                continue;
            }
            $parts[] = strtoupper(substr($word, 0, 3));
        }
        return $parts === [] ? 'XXX' : implode('-', $parts);
    }

    protected function defaultDuration($level)
    {
        $durations = [
            'undergraduate' => 4,
            'postgraduate' => 2,
            'graduate' => 1,
            'diploma' => 2,
            'certificate' => 1,
            'phd' => 3,
        ];
        return $durations[$level] ?? 4;
    }
}
