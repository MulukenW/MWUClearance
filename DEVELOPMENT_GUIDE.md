# Development Guide - MWU Clearance System

## 🚀 Quick Start Commands

### Backend Commands

#### Database Management
```bash
# Create fresh database with seeds
cd backend
php artisan migrate:fresh --seed

# Run only migrations
php artisan migrate

# Run only seeders
php artisan db:seed

# Rollback last migration
php artisan migrate:rollback

# Reset and re-run all migrations
php artisan migrate:refresh
```

#### Development Server
```bash
# Start Laravel development server
cd backend
php artisan serve
# Access at: http://localhost:8000
```

#### Artisan Commands
```bash
# Create a new model
php artisan make:model ModelName

# Create a new migration
php artisan make:migration create_table_name_table

# Create a new controller
php artisan make:controller ControllerName

# Create a new seeder
php artisan make:seeder SeederName

# Create a new middleware
php artisan make:middleware MiddlewareName

# Create a new request
php artisan make:request RequestName

# Create a new resource
php artisan make:resource ResourceName

# Clear application cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Database Access (XAMPP)

```bash
# Access MySQL CLI
C:\xampp\mysql\bin\mysql.exe -u root -p

# Use database
mysql> USE mwu_clearance;

# Show tables
mysql> SHOW TABLES;

# Describe table structure
mysql> DESCRIBE table_name;

# Query data
mysql> SELECT * FROM roles;
```

## 📁 Project Structure

### Backend Directory Structure
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # API controllers (to be created)
│   │   ├── Middleware/      # Custom middleware (to be created)
│   │   └── Requests/        # Form request validation (to be created)
│   ├── Models/              # Eloquent models ✅
│   ├── Policies/            # Authorization policies (to be created)
│   └── Services/            # Business logic services (to be created)
├── config/                  # Configuration files
├── database/
│   ├── migrations/          # Database migrations ✅
│   └── seeders/             # Database seeders ✅
├── routes/
│   ├── api.php             # API routes (to be created)
│   └── web.php             # Web routes
├── storage/                 # File storage
├── .env                    # Environment configuration ✅
└── PHASE1_SETUP.md         # Phase 1 documentation ✅
```

## 🗄️ Database Structure

### Tables and Relationships

#### Users & Roles
```
users
├── role_id → roles.id
├── department_id → departments.id
└── clearance_office_id → clearance_offices.id

roles ←→ permissions (many-to-many via role_permissions)
```

#### Academic Structure
```
colleges
└── departments
    └── programs
        └── students
```

#### Clearance System
```
student_types ←→ clearance_offices (via clearance_workflow_steps)

clearance_requests
├── student_id → students.id
└── clearance_items
    ├── clearance_office_id → clearance_offices.id
    ├── clearance_actions
    └── clearance_comments
```

## 🔧 Configuration Files

### .env Configuration
```env
# Application
APP_NAME="MWU Student Clearance System"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mwu_clearance
DB_USERNAME=root
DB_PASSWORD=

# Cache & Session
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

## 🎯 Development Workflow

### Adding a New Feature

1. **Create Migration**
   ```bash
   php artisan make:migration create_feature_table
   ```

2. **Edit Migration File**
   ```php
   // database/migrations/YYYY_MM_DD_HHMMSS_create_feature_table.php
   Schema::create('feature', function (Blueprint $table) {
       $table->id();
       $table->string('name');
       $table->timestamps();
   });
   ```

3. **Run Migration**
   ```bash
   php artisan migrate
   ```

4. **Create Model**
   ```bash
   php artisan make:model Feature
   ```

5. **Edit Model**
   ```php
   // app/Models/Feature.php
   protected $fillable = ['name'];
   ```

6. **Create Seeder (Optional)**
   ```bash
   php artisan make:seeder FeatureSeeder
   php artisan db:seed --class=FeatureSeeder
   ```

### Creating API Endpoints (Phase 2+)

1. **Create Controller**
   ```bash
   php artisan make:controller Api/FeatureController
   ```

2. **Define Routes**
   ```php
   // routes/api.php
   Route::get('/features', [FeatureController::class, 'index']);
   Route::post('/features', [FeatureController::class, 'store']);
   ```

3. **Create Request Validation**
   ```bash
   php artisan make:request StoreFeatureRequest
   ```

4. **Create API Resource**
   ```bash
   php artisan make:resource FeatureResource
   ```

## 🔍 Testing & Debugging

### Query Database
```bash
# Show all students
C:\xampp\mysql\bin\mysql.exe -u root mwu_clearance -e "SELECT * FROM students;"

# Show workflow for student type
C:\xampp\mysql\bin\mysql.exe -u root mwu_clearance -e "SELECT * FROM clearance_workflow_steps WHERE student_type_id = 1;"

# Show users with roles
C:\xampp\mysql\bin\mysql.exe -u root mwu_clearance -e "SELECT u.name, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id;"
```

### Check Laravel Logs
```bash
# View latest log entries
cat backend/storage/logs/laravel.log
```

### Test API Endpoints (Phase 2+)
```bash
# Using curl
curl http://localhost:8000/api/endpoint

# Using Postman
# Import collection and test endpoints
```

## 📝 Code Standards

### Model Conventions
```php
class Student extends Model
{
    // Mass assignable attributes
    protected $fillable = ['field1', 'field2'];
    
    // Type casting
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
    ];
    
    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
```

### Controller Conventions
```php
class StudentController extends Controller
{
    public function index()
    {
        // List resources
    }
    
    public function store(Request $request)
    {
        // Create resource
    }
    
    public function show($id)
    {
        // Show single resource
    }
    
    public function update(Request $request, $id)
    {
        // Update resource
    }
    
    public function destroy($id)
    {
        // Delete resource
    }
}
```

### API Response Format
```php
// Success response
return response()->json([
    'success' => true,
    'data' => $data,
    'message' => 'Operation successful'
], 200);

// Error response
return response()->json([
    'success' => false,
    'message' => 'Error message',
    'errors' => $errors
], 400);
```

## 🔐 Security Checklist

### Before Phase 2
- [ ] Verify all passwords are hashed
- [ ] Check foreign key constraints
- [ ] Verify unique constraints on critical fields
- [ ] Test cascade deletes

### Phase 2 (Authentication)
- [ ] Implement login/logout
- [ ] Add CSRF protection
- [ ] Implement rate limiting
- [ ] Add API token authentication
- [ ] Create role-based middleware

### Phase 3+ (Authorization)
- [ ] Implement department-based access
- [ ] Add clearance office authorization
- [ ] Verify sequential workflow enforcement
- [ ] Test unauthorized access attempts

## 🐛 Common Issues & Solutions

### Issue: Migration Fails
```bash
# Solution: Check database connection
php artisan config:clear
php artisan migrate
```

### Issue: Class Not Found
```bash
# Solution: Regenerate autoload files
composer dump-autoload
```

### Issue: Database Connection Error
```bash
# Solution: Verify XAMPP MySQL is running
# Check .env database credentials
# Test connection: mysql -u root
```

### Issue: Changes Not Reflected
```bash
# Solution: Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## 📚 Useful Resources

### Laravel Documentation
- [Laravel 8 Documentation](https://laravel.com/docs/8.x)
- [Eloquent ORM](https://laravel.com/docs/8.x/eloquent)
- [Migrations](https://laravel.com/docs/8.x/migrations)
- [Seeding](https://laravel.com/docs/8.x/seeding)

### Database
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [XAMPP Guide](https://www.apachefriends.org/index.html)

## 🎓 Next Steps

### Immediate (Phase 2)
1. Create authentication controllers
2. Implement login/logout API endpoints
3. Add JWT or Sanctum token authentication
4. Create role-based middleware
5. Test authentication flow

### Short-term (Phase 3-4)
1. Create ClearanceService class
2. Implement sequential approval logic
3. Create clearance API controllers
4. Add department authorization
5. Test workflow enforcement

### Mid-term (Phase 5-11)
1. WebAuthn implementation
2. Notification system
3. Audit logging
4. Admin management
5. Reports
6. Certificate generation
7. Comprehensive testing

### Long-term (Phase 12-18)
1. React frontend development
2. UI/UX implementation
3. Integration testing
4. Security hardening
5. Production deployment

---

**Tip**: Always test in development before deploying to production!
**Remember**: Backend security is critical - never rely on frontend validation alone.
