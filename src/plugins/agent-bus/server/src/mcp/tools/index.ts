import * as listAgents from './list-agents';
import * as sendMessage from './send-message';
import * as checkInbox from './check-inbox';
import * as claimMessage from './claim-message';
import * as getMessage from './get-message';
import * as reply from './reply';
import * as reportStatus from './report-status';
import * as submitProof from './submit-proof';
import * as escalate from './escalate';
import * as getThread from './get-thread';
import * as listApprovals from './list-approvals';
import * as decide from './decide';
import * as delegate from './delegate';
import * as cancel from './cancel';

export const tools = [
  listAgents,
  sendMessage,
  checkInbox,
  claimMessage,
  getMessage,
  reply,
  reportStatus,
  submitProof,
  escalate,
  getThread,
  listApprovals,
  decide,
  delegate,
  cancel,
];
