import type { Tab } from "../types/Tab";

type LeftSidebarProps = {
  header: string;
  isLeftSidebarCollapsed: boolean;
  changeIsLeftSidebarCollapsed: (isLeftSidebarCollapsed: boolean) => void;
  selectedTab: Tab;
  onSelectTab: (tab: Tab) => void;
  items: Tab[];
};

const DivisaSidebar = ({
  header,
  isLeftSidebarCollapsed,
  changeIsLeftSidebarCollapsed,
  selectedTab,
  onSelectTab,
  items,
}: LeftSidebarProps) => {
  const toggleCollapse = () =>
    changeIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);

  return (
    <div
      className={`z-10 h-screen bg-gray-200 transition-all duration-500 ease-in-out ${
        isLeftSidebarCollapsed ? "w-20" : "w-[16.5625rem]"
      }`}
    >
      {/* Logo + collapse controls */}
      <div className="flex items-center w-full px-3 pt-3">
        <button
          className="bg-white text-center w-12 min-w-12 rounded-md p-1.5 text-2xl font-extrabold cursor-pointer border-0"
          onClick={toggleCollapse}
        >
          <i className="fal fa-bars"></i>
        </button>

        <div
          className={`transition-all duration-500 ease-in-out ${
            isLeftSidebarCollapsed ? "opacity-0" : "opacity-100 delay-300"
          }`}
        >
          {!isLeftSidebarCollapsed && (
            <div className="ml-6 text-2xl font-bold">{`${header}`}</div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ul className="flex flex-col items-center list-none p-3 m-0 h-[calc(100%-3.65rem)] cursor-pointer">
        {items?.map((item) => (
          <li key={item.key} className="w-full mb-2.5">
            <button
              onClick={() => onSelectTab(item)}
              className={`flex items-center w-full h-12 rounded-lg px-3 transition-all duration-300 ease-in-out ${
                selectedTab.key === item.key
                  ? "bg-gray-300 text-black"
                  : "hover:bg-gray-300"
              }`}
            >
              <i
                className={`text-[22px] w-8 min-w-8 text-center ${item.icon}`}
              />
              <span
                className={`ml-6 transition-all duration-500 ease-in-out overflow-hidden ${
                  isLeftSidebarCollapsed
                    ? "w-0 opacity-0"
                    : "w-auto opacity-100 delay-300"
                }`}
              >
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DivisaSidebar;
