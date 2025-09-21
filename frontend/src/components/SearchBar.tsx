import { Search } from "lucide-react";

type Props = {
  search: string;
  setSearch: (search: string) => void;
  onSearch: () => void;
};

const SearchBar = ({ search, setSearch, onSearch }: Props) => {
  return (
    <div className="flex w-full sm:w-64 md:w-96 gap-2">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearch();
            }
          }}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
        />
      </div>

      <button
        onClick={() => {
          onSearch();
        }}
        className="btn-primary flex items-center justify-center"
      >
        Buscar
      </button>
    </div>
  );
};

export default SearchBar;
