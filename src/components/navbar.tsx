export const Navbar = () => {
  return (
    <header className="block w-full py-4 px-4 shadow">
      <nav className="flex justify-between items-center md:flex-row flex-col w-full">
        <div className="font-bold leading-6 tracking-wider uppercase">
          g-calander
        </div>
        <div className=" ">
          <svg
            className="w-6 h-6 text-gray-800"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
      </nav>
    </header>
  );
};
