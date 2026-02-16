import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans selection:bg-pink-500 selection:text-white">
            <Navbar />
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {children}
            </main>
            <Footer />
        </div>
    );
}
