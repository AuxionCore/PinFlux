## How to contribute to PinFlux

#### **Did you find a bug?**

- **Do not open up a GitHub issue if the bug is a security vulnerability
  in PinFlux**, and instead to refer to our [support page](https://chromewebstore.google.com/detail/molpfdakehebpkaecfdpndakphebjjpp/support).

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/AuxionCore/PinFlux/issues).

- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/AuxionCore/PinFlux/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

- PinFlux attaches itself to ChatGPT's own page structure, which changes without notice. Please include **which browser and ChatGPT interface** you saw the bug on, and a screenshot if the problem is visual — it is often the fastest way to tell a code bug from a ChatGPT redesign.

#### **Did you write a patch that fixes a bug?**

- **Open an issue first**, so the problem can be discussed before you spend time on a fix.

- Create a branch off `main` named `fix/<short-slug>` or `feat/<short-slug>`, and open a pull request from it. All changes reach `main` through a pull request.

- Ensure the PR description clearly describes the problem and solution, and include `Closes #<issue>` so the issue closes when the PR is merged.

- Before submitting, run `npm run compile` and `npm run build`, then load `.output/chrome-mv3/` as an unpacked extension and check your change in a real ChatGPT tab. There is no automated test suite, so this manual pass is the review.

- [CLAUDE.md](CLAUDE.md) documents the architecture, the ChatGPT selectors every feature depends on, and the full checklist a change is reviewed against. It is worth reading before your first PR.

#### **Did you fix whitespace, format code, or make a purely cosmetic patch?**

Changes that are cosmetic in nature and do not add anything substantial to the stability, functionality, or testability of PinFlux will generally not be accepted.

#### **Do you intend to add a new feature or change an existing one?**

- Suggest your Ideas in the [Ideas discussions on GitHub](https://github.com/AuxionCore/PinFlux/discussions/new?category=ideas).

- Do not open an issue on GitHub until you have positive feedback from the community about your idea. GitHub issues are primarily intended for bug reports and fixes.

#### **Do you have questions about the source code?**

- Ask any question about how to use PinFlux in the [support page](https://chromewebstore.google.com/detail/molpfdakehebpkaecfdpndakphebjjpp/support).

Thanks! :heart: :heart: :heart:

PinFlux 🌟
