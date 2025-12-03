import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { draggable?: boolean };

const Logo: React.FC<Props> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={96}
    height={36}
    {...props}
  >
    <title>{"Logo"}</title>
    <image href="/logo.svg" width="512" height="512" />
  </svg>
);

export default Logo;
