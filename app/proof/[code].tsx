import { Redirect, useLocalSearchParams } from 'expo-router';

// invisiproof://proof/<code> opens the seller's side of a Proof Request.
export default function ProofLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={{ pathname: '/(tabs)/(scan)/enter-proof-code', params: { code: code ?? '' } }} />;
}
