import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container-custom py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-heading font-bold text-primary-600">
            TravelHub
          </Link>
          <div className="flex gap-6">
            <Link to="/flights" className="hover:text-primary-600">Авиабилеты</Link>
            <Link to="/hotels" className="hover:text-primary-600">Отели</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
