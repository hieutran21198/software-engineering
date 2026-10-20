{
  description = "Software Engineering";

  inputs = {
    # nixpkgs
    # Keep Intel macOS support, which was removed from the 26.11 series.
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-26.05-darwin";

    # snowfall utilities
    snowfall-lib = {
      url = "github:snowfallorg/lib";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs:
    let
      core = inputs.snowfall-lib.mkLib {
        inherit inputs;
        src = ./nix;
        snowfall = {
          meta = {
            title = "Software Engineering Nix";
          };
        };
      };
    in
    core.mkFlake {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    };
}
