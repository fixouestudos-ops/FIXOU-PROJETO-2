export function latestVaultErrorAt(errors={}){
 return Object.values(errors).reduce((latest,error)=>Math.max(latest,Number(error?.lastAt)||0),0);
}

export function hasNewVaultErrors(state){
 const seenAt=Number(state?.errorVaultSeenAt)||0;
 return Object.values(state?.errors||{}).some(error=>!error.resolved&&(Number(error.lastAt)||0)>seenAt);
}

export function markVaultErrorsSeen(state){
 state.errorVaultSeenAt=Math.max(Number(state.errorVaultSeenAt)||0,latestVaultErrorAt(state.errors));
 return state.errorVaultSeenAt;
}
