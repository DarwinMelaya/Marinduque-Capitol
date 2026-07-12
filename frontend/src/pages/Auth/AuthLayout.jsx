export const BRAND_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAIcd6EZmkHvqGU_dkpxVw3k_FQB3XLdyP-JVBum1ebFUvp6-0sgV9Y2Ez66kPpn5g_znJZekF1Gxs0w1SWghCGIQIc2ccHvf5O1S4-Xic1UXBGamDqgcZ8npUCyKOvmn5LOqhC2W7N8R3BB7-2dYziWGbuCiWZ1pUEltb24d7yppNnAc-CA3fhxA8ppSpf6G3W02pxq7JztU0SE2JziKIhrHPC14ctOyAryg90-qQ7NazTlBREaW3ayg";

export const fieldClass =
  "w-full px-4 py-2.5 bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded transition-all font-sans text-sm text-on-surface";

export const labelClass =
  "text-[11px] leading-4 font-bold tracking-wider text-on-surface-variant uppercase group-focus-within:text-primary transition-colors";

export const AuthLayout = ({
  title,
  description,
  highlights = [],
  children,
}) => {
  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col md:flex-row min-h-[calc(100vh-5rem)]">
        <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
          <div
            className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply bg-cover bg-center"
            style={{ backgroundImage: `url('${BRAND_IMAGE}')` }}
            aria-hidden
          />
          <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-[#08522a]/70 via-transparent to-primary/20" />

          <div className="relative z-10 p-8 lg:p-12 text-on-primary max-w-xl">
            <div className="mb-6">
              <span className="text-xl font-bold tracking-tight text-primary-fixed">
                DTRS
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-4">
              {title}
            </h1>
            <p className="text-base leading-6 text-primary-fixed/90 mb-8">
              {description}
            </p>
            {highlights.length > 0 && (
              <div className="space-y-4">
                {highlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span
                      className="material-symbols-outlined text-primary-fixed shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-wide">
                        {item.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-primary-fixed/80">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-7/12 lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8 bg-surface overflow-y-auto">
          <div className="w-full max-w-[28rem]">{children}</div>
        </div>
      </main>

      <footer className="bg-surface-container-low border-t border-outline-variant w-full py-6 px-6 flex flex-col md:flex-row justify-between items-center gap-4 z-20">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <span className="text-sm font-semibold tracking-wide text-primary">
            DTRS
          </span>
          <p className="text-xs text-secondary text-center md:text-left">
            © 2024 DTRS Government Document Tracking System. All rights reserved.
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-6">
          {["Legal", "Privacy Policy", "Support", "Accessibility"].map(
            (label) => (
              <a
                key={label}
                className="text-xs text-on-surface-variant hover:underline hover:text-primary cursor-pointer transition-all"
                href="#"
              >
                {label}
              </a>
            ),
          )}
        </nav>
      </footer>
    </div>
  );
};
