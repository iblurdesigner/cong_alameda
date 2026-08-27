# Feature Spec: Creación de Usuarios

## Requirements
1. The system shall provide a "Nuevo Usuario" button on the `/usuarios` page header.
2. Clicking "Nuevo Usuario" shall display a modal with fields for name, email, password, phone, and role.
3. Submitting the form shall invoke `POST /api/users` with the entered user data.
4. On success, the user list shall refresh and display the newly created user.
