import { Suspense } from "react";

import { getCompareGroupsAction } from "@/actions/compare";
import { CompareGroupsClient } from "@/components/compare/CompareGroupsClient";

export default function CompareGroupsPage() {
  return (
    <Suspense fallback={<CompareGroupsClient groups={[]} />}>
      <CompareGroupsData />
    </Suspense>
  );
}

async function CompareGroupsData() {
  try {
    const groups = await getCompareGroupsAction("demo_user");
    return <CompareGroupsClient groups={groups} />;
  } catch (error) {
    return <CompareGroupsClient groups={[]} error={(error as Error).message || "Failed to load compare groups."} />;
  }
}
