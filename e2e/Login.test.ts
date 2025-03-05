import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { goto } from '$app/navigation';
import '@testing-library/jest-dom/extend-expect';
import Login from '../src/lib/components/Login.svelte';
import { setUser } from '../src/lib/stores/userStore';

// Mock external dependencies
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('$lib/stores/userStore', () => ({
  setUser: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Default mock implementation for fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, user: { id: '123', username: 'testuser' } })
    });
  });

  it('renders correctly with login form', () => {
    render(Login);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    render(Login);
    
    // Fill form fields
    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    await fireEvent.click(submitButton);
    
    // Verify fetch was called properly
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          identifier: 'testuser',
          password: 'password123'
        })
      });
    });
    
    // Verify user was set and redirection happened
    expect(setUser).toHaveBeenCalledWith({ id: '123', username: 'testuser' });
    expect(goto).toHaveBeenCalledWith('/auth');
  });

  it('displays error message on failed login', async () => {
    // Mock failed response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, error: 'Invalid password' })
    });
    
    render(Login);
    
    // Fill form fields
    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit the form
    await fireEvent.click(submitButton);
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });
    
    // Verify no redirection happened
    expect(goto).not.toHaveBeenCalled();
  });

  it('handles network errors gracefully', async () => {
    // Mock failed fetch
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    render(Login);
    
    // Fill form fields and submit
    await fireEvent.input(screen.getByLabelText(/username or email/i), { target: { value: 'testuser' } });
    await fireEvent.input(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    await fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });
  });
});