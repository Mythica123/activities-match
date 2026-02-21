import Header from '@/components/layout/Header';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <LoginForm />
    </div>
  );
}
