export const BRAND_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAIcd6EZmkHvqGU_dkpxVw3k_FQB3XLdyP-JVBum1ebFUvp6-0sgV9Y2Ez66kPpn5g_znJZekF1Gxs0w1SWghCGIQIc2ccHvf5O1S4-Xic1UXBGamDqgcZ8npUCyKOvmn5LOqhC2W7N8R3BB7-2dYziWGbuCiWZ1pUEltb24d7yppNnAc-CA3fhxA8ppSpf6G3W02pxq7JztU0SE2JziKIhrHPC14ctOyAryg90-qQ7NazTlBREaW3ayg";

export const fieldClass =
  "peer w-full rounded-xl border border-outline-variant/80 bg-white/80 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-on-surface outline-none transition-all duration-300 placeholder:text-on-surface-variant/45 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10";

export const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant transition-colors duration-300 group-focus-within:text-primary";

export const AuthField = ({
  id,
  label,
  icon,
  type = "text",
  rightSlot,
  className = "",
  as = "input",
  children,
  ...props
}) => {
  const Comp = as;

  return (
    <div className={`group ${className}`}>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span
            className={`material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-on-surface-variant/70 transition-colors group-focus-within:text-primary ${
              as === "textarea"
                ? "top-3.5"
                : "top-1/2 -translate-y-1/2"
            }`}
          >
            {icon}
          </span>
        )}
        {as === "select" ? (
          <select id={id} className={`${fieldClass} appearance-none cursor-pointer`} {...props}>
            {children}
          </select>
        ) : (
          <Comp
            id={id}
            type={as === "input" ? type : undefined}
            className={`${fieldClass} ${rightSlot ? "pr-12" : ""} ${as === "textarea" ? "min-h-[6.5rem] resize-none py-3" : ""}`}
            {...props}
          />
        )}
        {rightSlot}
        {as === "select" && (
          <span className="material-symbols-outlined pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/70">
            expand_more
          </span>
        )}
      </div>
    </div>
  );
};

export const AuthLayout = ({
  title,
  description,
  highlights = [],
  formTitle,
  formSubtitle,
  children,
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-on-surface">
      {/* Ambient page atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 85% 15%, rgba(13,114,59,0.08), transparent 60%), radial-gradient(ellipse 40% 35% at 10% 80%, rgba(47,90,74,0.06), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden auth-mesh text-on-primary lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
            style={{ backgroundImage: `url('${BRAND_IMAGE}')` }}
            aria-hidden
          />
          <div className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-primary-fixed/15 blur-3xl auth-float" />
          <div
            className="absolute -right-10 bottom-32 h-72 w-72 rounded-full bg-[#064422]/40 blur-3xl auth-float"
            style={{ animationDelay: "1.5s" }}
          />

          <div className="relative z-10 flex items-center gap-3 p-10 xl:p-14">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
              <span
                className="material-symbols-outlined text-[28px] text-primary-fixed"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield
              </span>
              <span className="absolute inset-0 rounded-2xl border border-primary-fixed/30 auth-pulse-ring" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tracking-tight text-white">
                DTRS
              </p>
              <p className="text-xs font-medium tracking-[0.18em] text-primary-fixed/80 uppercase">
                Marinduque Capitol
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-xl px-10 pb-8 xl:px-14 auth-fade-up">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-fixed/90">
              Document Tracking System
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-primary-fixed/90">
              {description}
            </p>

            {highlights.length > 0 && (
              <ul className="mt-10 space-y-4">
                {highlights.map((item, index) => (
                  <li
                    key={item.title}
                    className={`flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm auth-fade-up auth-fade-up-delay-${index + 1}`}
                  >
                    <span
                      className="material-symbols-outlined mt-0.5 shrink-0 text-primary-fixed"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-primary-fixed/80">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative z-10 border-t border-white/10 px-10 py-5 text-xs text-primary-fixed/70 xl:px-14">
            Secure access for authorized provincial personnel only.
          </div>
        </section>

        {/* Form panel */}
        <section className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-[26rem]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2.5">
                <span
                  className="material-symbols-outlined text-primary text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield
                </span>
                <span className="font-display text-xl font-bold text-primary">
                  DTRS
                </span>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Secure
              </span>
            </div>

            <div className="auth-fade-up">
              <h2 className="font-display text-3xl font-bold tracking-tight text-primary">
                {formTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {formSubtitle}
              </p>
            </div>

            <div className="mt-8 auth-fade-up auth-fade-up-delay-1">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
};
