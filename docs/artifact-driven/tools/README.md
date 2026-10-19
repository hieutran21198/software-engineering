# Tools

This directory holds the ADD record validator. It checks the knowledge records of a repository with fixed rules and changes no file.

## Run the validator

The validator needs Node.js 24 or later. Run it from the repository root:

```sh
node docs/artifact-driven/tools/add-validate.mjs
node docs/artifact-driven/tools/add-validate.mjs --change <artifact>/<change>
```

`--repository <path>` selects another repository root. `--change` limits the checks to the files of one change. The validator writes one JSON object to standard output. Exit status 0 means no error, 1 means at least one error, and 2 means invalid arguments or a repository that it cannot read.

## When the file is missing

The file `add-validate.mjs` is present only when the release build supplies it. A bundle copied from a Git checkout, or from a release built without it, contains only this guide. Adoption succeeds without the validator. In that case, do the record checks by hand during each self-check.
