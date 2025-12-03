import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { draggable?: boolean };

const LogoFont: React.FC<Props> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 128"
    width={144}
    height={36}
    {...props}
  >
    <title>{"Logo Font"}</title>
    <image href="/logo-font.svg" width="512" height="128" />
  </svg>
);

export default LogoFont;
