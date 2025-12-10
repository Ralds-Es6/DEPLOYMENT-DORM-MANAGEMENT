const Footer = () => {
  return (
    <footer className="flex-shrink-0 bg-white border-t border-gray-200">
      <div className="px-6 py-3">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <div>
            <p className="text-center md:text-left text-sm text-gray-600">&copy; {new Date().getFullYear()} KARMIN'S DORMITORY. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;