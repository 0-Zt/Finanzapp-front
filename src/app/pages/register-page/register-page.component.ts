import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Las contrasenas no coinciden.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { fullName, email } = this.registerForm.value;
    this.authService.signUp({ email, password, fullName }).subscribe({
      next: (response) => {
        if (response.requiresEmailConfirmation) {
          this.isLoading = false;
          this.successMessage =
            response.message || 'Revisa tu correo para confirmar tu cuenta antes de iniciar sesion.';
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Error al registrarse. Por favor, intenta de nuevo.';
      },
    });
  }

  get fullNameInvalid(): boolean {
    const control = this.registerForm.get('fullName');
    return !!control && control.invalid && control.touched;
  }

  get emailInvalid(): boolean {
    const control = this.registerForm.get('email');
    return !!control && control.invalid && control.touched;
  }

  get passwordInvalid(): boolean {
    const control = this.registerForm.get('password');
    return !!control && control.invalid && control.touched;
  }

  get confirmPasswordInvalid(): boolean {
    const control = this.registerForm.get('confirmPassword');
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = control?.value;
    return !!control && control.touched && (control.invalid || password !== confirmPassword);
  }
}
