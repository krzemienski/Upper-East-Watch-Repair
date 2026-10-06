import { ListCustomersQueryParams, ListCustomersResponse } from "@workspace/api-zod";
import { db, repairLeadsTable, type RepairLead } from "@workspace/db";
import { desc } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { isAdminRequest } from "../lib/adminAuth";

/**
 * Customers are not stored separately: they are derived from repair requests.
 * Requests that share a normalized phone number or email address are joined
 * into one customer (transitively), so a person who used their phone once and
 * their email another time still appears once when any request links the two.
 */

const router: IRouter = Router();

function normalizePhone(value: string | null): string | null {
  if (!value) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length >= 5 ? `phone:${digits}` : null;
}

function normalizeEmail(value: string | null): string | null {
  const email = value?.trim().toLowerCase();
  return email ? `email:${email}` : null;
}

function groupLeads(leads: RepairLead[]): RepairLead[][] {
  const parent = new Map<number, number>();
  const find = (id: number): number => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let node = id;
    while (node !== root) {
      const next = parent.get(node)!;
      parent.set(node, root);
      node = next;
    }
    return root;
  };
  const owner = new Map<string, number>();
  for (const lead of leads) {
    parent.set(lead.id, lead.id);
    for (const key of [normalizePhone(lead.phone), normalizeEmail(lead.email)]) {
      if (!key) continue;
      const existing = owner.get(key);
      if (existing === undefined) owner.set(key, lead.id);
      else parent.set(find(lead.id), find(existing));
    }
  }
  const groups = new Map<number, RepairLead[]>();
  for (const lead of leads) {
    const root = find(lead.id);
    groups.set(root, [...(groups.get(root) ?? []), lead]);
  }
  return [...groups.values()];
}

function unique(values: (string | null)[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) seen.set(trimmed.toLowerCase(), trimmed);
  }
  return [...seen.values()];
}

router.get("/admin/customers", async (req, res): Promise<void> => {
  if (!isAdminRequest(res)) return;
  const query = ListCustomersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid customer search" });
    return;
  }
  // Newest first, so the first lead in each group is the latest request.
  const leads = await db.select().from(repairLeadsTable).orderBy(desc(repairLeadsTable.createdAt));
  const search = query.data.search?.trim().toLowerCase();
  const searchDigits = search?.replace(/\D/g, "");

  const customers = groupLeads(leads)
    .map((group) => {
      const latest = group[0]!;
      const oldest = group[group.length - 1]!;
      const phones = unique(group.map((lead) => lead.phone));
      const emails = unique(group.map((lead) => lead.email));
      const key =
        normalizeEmail(latest.email) ?? normalizePhone(latest.phone) ?? `lead:${latest.id}`;
      return {
        key,
        name: latest.name,
        names: unique(group.map((lead) => lead.name)),
        emails,
        phones,
        preferredChannel: latest.preferredChannel,
        requestCount: group.length,
        firstRequestAt: oldest.createdAt,
        lastRequestAt: latest.createdAt,
        latestStatus: latest.status,
        requests: group.map((lead) => ({
          id: lead.id,
          status: lead.status,
          intakeMode: lead.intakeMode,
          description: lead.description,
          createdAt: lead.createdAt,
          ...(lead.serviceNeeded ? { serviceNeeded: lead.serviceNeeded } : {}),
          ...(lead.watchBrand ? { watchBrand: lead.watchBrand } : {}),
          ...(lead.watchModel ? { watchModel: lead.watchModel } : {}),
          ...(lead.selectedCta ? { selectedCta: lead.selectedCta } : {}),
        })),
      };
    })
    .filter((customer) => {
      if (!search) return true;
      const text = [...customer.names, ...customer.emails, ...customer.phones].join(" ").toLowerCase();
      if (text.includes(search)) return true;
      return !!searchDigits && searchDigits.length >= 3 &&
        customer.phones.some((phone) => phone.replace(/\D/g, "").includes(searchDigits));
    });

  res.json(ListCustomersResponse.parse(customers));
});

export default router;
