<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        // For API requests, don't redirect - return null to let the default 401 response handle it
        if ($request->is('api/*') || $request->expectsJson()) {
            return null;
        }
        
        // For web requests, redirect to login if route exists
        if (route('login', [], false)) {
            return route('login');
        }
        
        return null;
    }
}
