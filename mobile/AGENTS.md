# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v55.0.0/ before writing any code.


## TraceVault
TraceVault is a cyberbullying evidence preservation tool that helps victims capture, secure, and report online harassment in a legally credible format.
When harassment happens online — abusive messages, threats, hate comments — victims often lose their evidence before they can report it. Screenshots get deleted, platforms remove flagged content, and regular photos are easy to dismiss as edited. TraceVault solves this.

How it works
Victims use either the mobile app or the browser extension to capture evidence the moment harassment occurs. The mobile app lets users pick a screenshot from their gallery, automatically reads the image metadata to check for prior tampering, and prompts them to paste the harassing message and note the sender. The browser extension goes further — it captures the full visible page, automatically extracts the message content, sender identity, and URL directly from the DOM without any manual input.
In both cases, a SHA-256 cryptographic hash is computed on the device before anything is sent. This hash is a unique mathematical fingerprint of the image. If even a single pixel is changed later, the hash changes completely — making tampering detectable.
The evidence — image, message text, metadata, and hash — is sent to a secure backend. The image is stored in an encrypted AWS S3 bucket. The metadata and hash are stored separately in a database. The hash is timestamped server-side the moment it arrives, creating an independent record that cannot be altered by the victim or anyone else.
From the app, victims can view their complete evidence vault, see the integrity status of each capture, and export a structured PDF incident report containing the screenshot, message content, sender details, timestamp, and verified hash — formatted for submission to law enforcement, college disciplinary committees, or platform trust and safety teams.

What makes it different
A regular screenshot proves nothing. TraceVault produces tamper-evident, timestamped, cryptographically verified evidence with a paper trail — turning a scared victim's phone into a legally credible documentation tool.

## Rules
- Dont write a component more than twice, if needed create that component in component folder and use as many times as needed.
- Dont use any depricated packages, always use latest ones.
- Dont use inline styles at all, use stylesheet everywhere
- dont use colors, create a colors const in const folder and put all the colors in that and use everywhere needed