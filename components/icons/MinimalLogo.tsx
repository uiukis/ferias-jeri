import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { draggable?: boolean };

const MinimalLogo: React.FC<Props> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    width={64}
    height={64}
    {...props}
  >
    <title>{"Minimal Logo"}</title>
    <image href="/minimal-logo.svg" width="256" height="256" />
  </svg>
);

export default MinimalLogo;
