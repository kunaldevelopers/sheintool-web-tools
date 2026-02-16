export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex justify-center md:justify-start space-x-6 md:order-2">
                        <p className="text-gray-400 text-sm">
                            Built with ❤️ for productivity.
                        </p>
                    </div>
                    <div className="mt-8 md:mt-0 md:order-1">
                        <p className="text-center md:text-left text-base text-gray-400">
                            &copy; {new Date().getFullYear()} SheinTool. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
