package services

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"
	"sync"

	"cong-alameda-backend/internal/models"
)

type NotificationService struct {
	emailConfig EmailConfig
	fromName    string
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
	Enabled      bool
}

// Notification types
type NotificationType string

const (
	NotificationUserRegistered NotificationType = "user_registered"
	NotificationNewAssignment  NotificationType = "new_assignment"
	NotificationVisitScheduled NotificationType = "visit_scheduled"
	NotificationVisitReminder  NotificationType = "visit_reminder"
)

// Email templates
type EmailTemplate struct {
	Subject string
	Body    string
}

var (
	emailTemplates = map[NotificationType]EmailTemplate{
		NotificationUserRegistered: {
			Subject: "Bienvenido a la Congregación Alameda",
			Body: `Hola {{.Nombre}},

¡Bienvenido a la aplicación de la Congregación Alameda!

Tus credenciales de acceso son:
- Email: {{.Email}}
- Contraseña: La que estableciste al registrarte

Ahora puedes:
- Ver tus asignaciones de servicio
- Registrar las visitas que realices
- Actualizar tu información de contacto

Si tienes alguna pregunta, contacta al Superintendente.

Saludos cordiales,
Congregación Alameda`,
		},
		NotificationNewAssignment: {
			Subject: "Nueva Asignación de Servicio",
			Body: `Hola {{.Nombre}},

Se te ha asignado una nueva responsabilidad:

- Fecha: {{.Fecha}}
- Tipo: {{.Tipo}}
- Observaciones: {{.Observaciones}}

Por favor confirma tu disponibilidad.

Saludos,
Congregación Alameda`,
		},
		NotificationVisitScheduled: {
			Subject: "Visita Programada",
			Body: `Hola {{.Nombre}},

Se ha programado una visita:

- Casa: {{.Direccion}}
- Fecha: {{.Fecha}}
- Observaciones: {{.Observaciones}}

Recuerda realizar la visita y registrar los resultados en la aplicación.

Saludos,
Congregación Alameda`,
		},
		NotificationVisitReminder: {
			Subject: "Recordatorio de Visita",
			Body: `Hola {{.Nombre}},

Tienes una visita programada para mañana:

- Casa: {{.Direccion}}
- Fecha: {{.Fecha}}

No olvides realizar la visita y registrar los resultados.

Saludos,
Congregación Alameda`,
		},
	}

	// Global instance
	instance *NotificationService
	once     sync.Once
)

// InitNotificationService initializes the notification service
func InitNotificationService(config EmailConfig) {
	once.Do(func() {
		instance = &NotificationService{
			emailConfig: config,
			fromName:    config.FromName,
		}
		log.Printf("[NOTIFICATION] Service initialized. Email enabled: %v", config.Enabled)
	})
}

// GetNotificationService returns the global notification service
func GetNotificationService() *NotificationService {
	return instance
}

// SendUserRegisteredNotification sends welcome email to new user
func (s *NotificationService) SendUserRegisteredNotification(user *models.User) error {
	if !s.emailConfig.Enabled {
		log.Println("[NOTIFICATION] Email disabled, skipping user registered notification")
		return nil
	}

	if !user.NotificacionesEmail {
		log.Printf("[NOTIFICATION] User %s has email notifications disabled", user.Email)
		return nil
	}

	template := emailTemplates[NotificationUserRegistered]
	body := strings.ReplaceAll(template.Body, "{{.Nombre}}", user.Nombre)
	body = strings.ReplaceAll(body, "{{.Email}}", user.Email)

	return s.sendEmail(user.Email, template.Subject, body)
}

// SendNewAssignmentNotification notifies user of new assignment
func (s *NotificationService) SendNewAssignmentNotification(user *models.User, assignmentType, fecha string, observaciones string) error {
	if !s.emailConfig.Enabled {
		log.Println("[NOTIFICATION] Email disabled, skipping assignment notification")
		return nil
	}

	if !user.NotificacionesEmail {
		log.Printf("[NOTIFICATION] User %s has email notifications disabled", user.Email)
		return nil
	}

	template := emailTemplates[NotificationNewAssignment]
	body := strings.ReplaceAll(template.Body, "{{.Nombre}}", user.Nombre)
	body = strings.ReplaceAll(body, "{{.Fecha}}", fecha)
	body = strings.ReplaceAll(body, "{{.Tipo}}", assignmentType)
	if observaciones == "" {
		body = strings.ReplaceAll(body, "{{.Observaciones}}", "Sin observaciones")
	} else {
		body = strings.ReplaceAll(body, "{{.Observaciones}}", observaciones)
	}

	return s.sendEmail(user.Email, template.Subject, body)
}

// SendVisitScheduledNotification notifies user of scheduled visit
func (s *NotificationService) SendVisitScheduledNotification(user *models.User, direccion, fecha, observaciones string) error {
	if !s.emailConfig.Enabled {
		log.Println("[NOTIFICATION] Email disabled, skipping visit notification")
		return nil
	}

	if !user.NotificacionesEmail {
		log.Printf("[NOTIFICATION] User %s has email notifications disabled", user.Email)
		return nil
	}

	template := emailTemplates[NotificationVisitScheduled]
	body := strings.ReplaceAll(template.Body, "{{.Nombre}}", user.Nombre)
	body = strings.ReplaceAll(body, "{{.Direccion}}", direccion)
	body = strings.ReplaceAll(body, "{{.Fecha}}", fecha)
	if observaciones == "" {
		body = strings.ReplaceAll(body, "{{.Observaciones}}", "Sin observaciones")
	} else {
		body = strings.ReplaceAll(body, "{{.Observaciones}}", observaciones)
	}

	return s.sendEmail(user.Email, template.Subject, body)
}

// sendEmail sends an email
func (s *NotificationService) sendEmail(to, subject, body string) error {
	if !s.emailConfig.Enabled {
		return nil
	}

	// Construct email headers
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", s.fromName, s.emailConfig.FromEmail)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/plain; charset=UTF-8"

	// Build message
	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(body)

	// Connect to SMTP server
	addr := fmt.Sprintf("%s:%s", s.emailConfig.SMTPHost, s.emailConfig.SMTPPort)

	auth := smtp.PlainAuth("", s.emailConfig.SMTPUsername, s.emailConfig.SMTPPassword, s.emailConfig.SMTPHost)

	err := smtp.SendMail(addr, auth, s.emailConfig.FromEmail, []string{to}, []byte(msg.String()))
	if err != nil {
		log.Printf("[NOTIFICATION] Failed to send email to %s: %v", to, err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("[NOTIFICATION] Email sent successfully to %s", to)
	return nil
}
