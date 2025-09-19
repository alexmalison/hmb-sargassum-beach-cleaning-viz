{
  description = "HMB Sargassum Beach Cleaning Visualization Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; config.allowUnfree = true; };
      in {
        devShells.default = pkgs.mkShell {
          name = "hmb-sargassum-viz";
          packages = [
            pkgs.nodejs_20
            pkgs.yarn
            pkgs.direnv
          ];
          shellHook = ''
            export YARN_ENABLE_IMMUTABLE_INSTALLS=false
          '';
        };
      });
}
