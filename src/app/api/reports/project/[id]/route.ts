import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reports/project/[id]?type=financial|payment|wbs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "financial";

  const project = await db.project.findUnique({
    where: { id },
    include: {
      tenant: true,
      detailBoqs: { orderBy: { code: "asc" } },
      financialSheet: { orderBy: { code: "asc" } },
      chapters: { orderBy: { chapterNo: "asc" } },
      payments: {
        orderBy: { periodNo: "asc" },
        include: { items: true },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

  if (type === "wbs") {
    const wbs = buildWBS(project.financialSheet);
    return NextResponse.json({ project, wbs });
  }

  if (type === "payment") {
    return NextResponse.json({ project });
  }

  return NextResponse.json({ project });
}

function buildWBS(items: { code: string; description: string; totalAmount: number }[]) {
  const root: WBSNode = { code: "", title: "ریشه", children: [], amount: 0 };
  for (const it of items) {
    const parts = it.code.match(/.{1,2}/g) || [it.code];
    let node = root;
    let prefix = "";
    for (let i = 0; i < parts.length; i++) {
      prefix += parts[i];
      let child = node.children.find((c) => c.code === prefix);
      if (!child) {
        child = {
          code: prefix,
          title: i === parts.length - 1 ? it.description : `گروه ${prefix}`,
          children: [],
          amount: 0,
        };
        node.children.push(child);
      }
      child.amount += it.totalAmount;
      node = child;
    }
  }
  return root;
}

interface WBSNode {
  code: string;
  title: string;
  amount: number;
  children: WBSNode[];
}
