# Sprint Planning Poker — Domain Glossary

## Session
A single planning poker room. Created by the Host, identified by a unique URL. Sharing the URL is sufficient to join — the URL acts as the access credential. No separate authentication exists. If the Host disconnects, the Session enters a grace period; if the Host does not reconnect within that window, the Session ends for all Participants.

## Host
The player who created the Session. Has elevated powers: reveal votes, reset the round, advance to the next ticket, and kick players. Exactly one Host per Session. The Host is authenticated by possession of the Host URL — a distinct URL from the Participant URL. The Participant URL is freely shareable; the Host URL is the credential.

## Player
Any participant in a Session, including the Host. Identified by a display name entered on join. A Player's identity exists only for the duration of the Session — there are no accounts. Each Player is issued a Player Token on first join.

## Player Token
A UUID issued by the server when a Player first joins a Session. Stored in the Player's browser (`localStorage`, keyed by Session ID). Presented automatically on reconnect to restore the Player's seat and preserved vote. Not transferable across devices — a different device is treated as a new Player.

## Host URL
The URL given to the Session creator. Possession of this URL is the sole credential for Host actions. Distinct from the Participant URL.

## Participant URL
The shareable URL that players use to join a Session. Visiting it triggers the Name Prompt.

## Name Prompt
The overlay shown when first entering a Session (both on session creation and on joining via URL). Captures the Player's display name before they enter the room.

## Kick
A Host action that removes a Player from the Session. The kicked Player loses their seat and their vote for the current round is discarded.

## Round
One estimation cycle for a single Ticket. Begins when the Session starts (or after reset/next). Ends when the Host reveals votes or resets.

## Ticket
The backlog item currently being estimated. Entered manually by the Host as free text (e.g. `DEV-482` or a short description). Fully optional — a Round can be run with no Ticket label. No type field (Story/Bug) in the MVP.

## Consensus
A state reached when every Player has voted and all votes are equal. Triggers the animated "★ CONSENSUS ★" banner. Always enabled — not configurable.

## Phase
The state of the current Round. Either `voting` (players are choosing cards) or `revealed` (votes are shown with stats).

## Presenter Mode
An optional session-level setting activated by the Host at the Name Prompt before joining. When active, the Host's card selection in the Hand Fan is visually suppressed — no highlight, no animation — so screen-share watchers cannot read the Host's vote. The Host's card still lands face-down on the table as normal feedback. Does not affect Participants.
