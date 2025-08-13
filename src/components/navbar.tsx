import React from "react";
import CurdContext from "../context/useCrudContext";
import { debounce } from "../utils/helper";
import { Inputs } from "./input";

export const Navbar = () => {
  const { setSearchTerm } = React.useContext(CurdContext);

  const debouncedSearch = React.useCallback(
    (value: string) => {
      debounce((val: string) => setSearchTerm(val), 300)(value);
    },
    [setSearchTerm]
  );

  return (
    <header className="block w-full py-4 px-4 shadow">
      <nav className="flex justify-between items-center md:flex-row flex-col w-full">
        <div className="font-bold leading-6 tracking-wider uppercase">
          g-calander
        </div>
        <div className="flex gap-2 items-center">
          <Inputs
            type="search"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              debouncedSearch(e.target.value)
            }
            id="search"
            name="search"
            placeholder="Search..."
            className="w-fit ring rounded-md px-2 placeholder:text-xs font-medium text-black placeholder:text-gray-400"
          />
        </div>
      </nav>
    </header>
  );
};
