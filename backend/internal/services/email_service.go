package services

import "log"

// EmailService defines the interface for sending emails
type EmailService interface {
	SendPasswordReset(email string, token string) error
}

// ConsoleEmailService logs recovery URLs to stdout
type ConsoleEmailService struct {
	frontendURL string
}

// NewConsoleEmailService creates a new ConsoleEmailService
func NewConsoleEmailService(frontendURL string) *ConsoleEmailService {
	return &ConsoleEmailService{frontendURL: frontendURL}
}

// SendPasswordReset logs the recovery URL to stdout
func (s *ConsoleEmailService) SendPasswordReset(email string, token string) error {
	log.Printf("[Password Recovery] Link for %s: %s/recovery?token=%s", email, s.frontendURL, token)
	return nil
}
