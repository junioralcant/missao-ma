type SiteHeaderProps = {
  label?: string;
};

export const SiteHeader = ({label}: SiteHeaderProps) => (
  <header className="site-header">
    <span className="wordmark">
      Missão <span className="wordmark-accent">Maranhão</span>
    </span>
    {label ? <span className="site-header-label">{label}</span> : null}
  </header>
);
