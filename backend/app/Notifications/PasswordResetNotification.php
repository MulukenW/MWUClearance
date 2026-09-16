<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification
{
    use Queueable;

    private $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/');
        $resetUrl = $frontendUrl . '/reset-password?email=' . urlencode($notifiable->email)
            . '&token=' . urlencode($this->token);

        return (new MailMessage)
            ->subject('Reset your MWU Clearance System password')
            ->greeting('Hello ' . ($notifiable->name ?: 'there') . ',')
            ->line('We received a request to reset your password.')
            ->action('Reset Password', $resetUrl)
            ->line('This link will expire in one hour.')
            ->line('If you did not request a password reset, no further action is required.');
    }
}
