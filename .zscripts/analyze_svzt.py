#!/usr/bin/env python3
"""Memory-safe streaming analyzer for the Texsa .svzt (NewDataSet XML) file.

Counts tables, rows per table, union of columns per table (with first-seen order),
and captures sample values for key tables. Uses iterparse with element clearing so
peak memory stays low even on the ~71MB file.
"""
import sys
import json
import xml.etree.ElementTree as ET
from collections import OrderedDict

SRC = sys.argv[1] if len(sys.argv) > 1 else "Important project.svzt"
OUT_SCHEMA = sys.argv[2] if len(sys.argv) > 2 else "src/lib/texsa/generated-schema.json"

KEY_TABLES = {
    "brv_contract", "brv_fhpy", "brv_fhbh", "brv_rzmt", "brv_khmt", "brv_bgml",
    "brv_type_situ", "brv_situ", "brv_ahta", "brv_intp", "brv_kosorat",
    "brv_Tadilkosorat", "brv_hmpy", "brv_hmbs", "brv_dstn_main", "brv_dstb",
    "brv_dstn_fromto", "brv_sorc_all", "brv_sorc", "brv_nmmhb", "brv_acts",
    "brv_type", "brv_mogs", "brv_grop", "brv_mult", "brv_ader",
}

def main():
    table_counts = OrderedDict()      # table -> row count
    table_cols = OrderedDict()        # table -> OrderedDict(col -> non_empty_count)
    samples = {}                      # table -> list of first sample rows (dict)
    table_order = []                  # first-seen order of tables

    depth = 0
    cur_table = None
    cur_row = None
    total_rows = 0

    # iterparse over start/end events; depth-1 elements are table rows.
    context = ET.iterparse(SRC, events=("start", "end"))
    root = None
    for event, elem in context:
        tag = elem.tag
        if event == "start":
            depth += 1
            if depth == 1:
                root = elem  # NewDataSet
            elif depth == 2:
                # start of a table row element
                cur_table = tag
                cur_row = OrderedDict()
                if cur_table not in table_counts:
                    table_counts[cur_table] = 0
                    table_cols[cur_table] = OrderedDict()
                    table_order.append(cur_table)
        else:  # end
            if depth == 3 and cur_row is not None:
                # a field/column element of the current row
                col = tag
                val = (elem.text or "").strip()
                cols = table_cols[cur_table]
                if col not in cols:
                    cols[col] = 0
                if val != "":
                    cols[col] += 1
                cur_row[col] = val
            elif depth == 2 and cur_table is not None:
                # end of a table row
                table_counts[cur_table] += 1
                total_rows += 1
                if cur_table in KEY_TABLES:
                    lst = samples.setdefault(cur_table, [])
                    if len(lst) < 2:
                        lst.append(cur_row)
                cur_row = None
                cur_table = None
                # free memory for this completed row subtree
                elem.clear()
            depth -= 1
            # periodically clear root children we've finished to bound memory
            if event == "end" and depth == 1 and root is not None:
                # keep root small
                if len(root) > 50:
                    root.clear()

    # Build schema object
    tables = []
    for t in table_order:
        cols = table_cols[t]
        tables.append(OrderedDict([
            ("name", t),
            ("rowCount", table_counts[t]),
            ("columnCount", len(cols)),
            ("columns", [{"name": c, "nonEmpty": cols[c]} for c in cols]),
        ]))

    schema = OrderedDict([
        ("source", SRC),
        ("root", "NewDataSet"),
        ("totalTables", len(table_order)),
        ("totalRows", total_rows),
        ("tables", tables),
    ])

    with open(OUT_SCHEMA, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)

    # Print a human summary to stdout
    print(f"TOTAL_TABLES={len(table_order)}")
    print(f"TOTAL_ROWS={total_rows}")
    print("--- TABLE COUNTS (sorted desc) ---")
    for t in sorted(table_order, key=lambda x: -table_counts[x]):
        print(f"{table_counts[t]:>8}  {len(table_cols[t]):>4}cols  {t}")

    # Dump key-table samples to a side file for the analysis doc
    with open("/tmp/svzt_samples.json", "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)
    print("SAMPLES_WRITTEN=/tmp/svzt_samples.json")

if __name__ == "__main__":
    main()
