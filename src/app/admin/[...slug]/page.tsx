
import { redirect } from 'next/navigation';

// This component catches all requests to /admin/* that don't match an existing page.
// It immediately redirects the user to the login page to prevent 404 errors and
// ensure that users don't land on broken or unauthorized admin pages.
export default function AdminCatchAllPage() {
  redirect('/login');
}
