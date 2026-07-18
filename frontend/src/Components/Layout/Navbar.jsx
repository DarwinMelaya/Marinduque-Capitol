import { Link } from "react-router-dom";
import { getHomePath, getSession } from "../../api/auth";

const Navbar = () => {
  const session = getSession();

  return (
    <header className="z-30">
      <div className="rounded-2xl border border-white/50 bg-white/70 backdrop-blur-md shadow-[0_8px_24px_rgba(96,119,150,0.12)] px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={getHomePath(session)}
            className="flex items-center gap-3 min-w-0"
          >
            <img
              src="/img/dostlogo.png"
              alt="DOST"
              className="h-11 w-11 sm:h-12 sm:w-12 object-contain shrink-0"
            />
            <img
              src="/img/logo.png"
              alt="Lalawigan ng Marinduque"
              className="h-11 w-11 sm:h-12 sm:w-12 object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6a08a]">
                DTRS
              </p>
              <h1 className="text-sm sm:text-base font-extrabold tracking-[0.06em] text-[#607796] truncate">
                GOVERNMENT OF MARINDUQUE
              </h1>
            </div>
          </Link>

          {session && (
            <div className="hidden sm:block text-right shrink-0">
              <p className="text-sm font-semibold text-[#3f5168] truncate max-w-[14rem]">
                {session.fullName}
              </p>
              <p className="text-xs text-[#a6a08a]">{session.role}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
