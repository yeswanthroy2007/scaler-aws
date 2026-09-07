import { describe, expect, it } from "vitest";
import { defaultValuesForType, validateRecordForm } from "./recordValidation";

describe("validateRecordForm", () => {
  it("accepts a valid A record", () => {
    const values = defaultValuesForType("A", { name: "www", value: "192.0.2.1" });
    expect(validateRecordForm(values)).toEqual({});
  });

  it("rejects an invalid IPv4 address for an A record", () => {
    const values = defaultValuesForType("A", { name: "www", value: "999.999.1.1" });
    const errors = validateRecordForm(values);
    expect(errors.value).toBeDefined();
  });

  it("rejects an invalid IPv6 address for an AAAA record", () => {
    const values = defaultValuesForType("AAAA", { name: "www", value: "not-an-ipv6" });
    const errors = validateRecordForm(values);
    expect(errors.value).toBeDefined();
  });

  it("rejects a CNAME record at the zone apex", () => {
    const values = defaultValuesForType("CNAME", { name: "", value: "target.example.com" });
    const errors = validateRecordForm(values);
    expect(errors.name).toBeDefined();
  });

  it("accepts a CNAME record at a subdomain", () => {
    const values = defaultValuesForType("CNAME", { name: "www", value: "target.example.com" });
    expect(validateRecordForm(values)).toEqual({});
  });

  it("requires a priority for MX records", () => {
    const values = defaultValuesForType("MX", { name: "", value: "mail.example.com", priority: undefined });
    const errors = validateRecordForm(values);
    expect(errors.priority).toBeDefined();
  });

  it("requires priority, weight, and port for SRV records", () => {
    const values = defaultValuesForType("SRV", {
      name: "_sip._tcp",
      value: "sip.example.com",
      priority: undefined,
      weight: undefined,
      port: undefined,
    });
    const errors = validateRecordForm(values);
    expect(errors.priority).toBeDefined();
    expect(errors.weight).toBeDefined();
    expect(errors.port).toBeDefined();
  });

  it("requires a valid tag for CAA records", () => {
    const values = defaultValuesForType("CAA", { name: "", value: "letsencrypt.org", tag: "bogus" });
    const errors = validateRecordForm(values);
    expect(errors.tag).toBeDefined();
  });

  it("accepts a valid CAA record", () => {
    const values = defaultValuesForType("CAA", { name: "", value: "letsencrypt.org", tag: "issue", flags: 0 });
    expect(validateRecordForm(values)).toEqual({});
  });

  it("rejects an empty required value", () => {
    const values = defaultValuesForType("TXT", { name: "", value: "" });
    const errors = validateRecordForm(values);
    expect(errors.value).toBeDefined();
  });

  it("rejects a negative TTL", () => {
    const values = defaultValuesForType("A", { name: "www", value: "192.0.2.1", ttl: -5 });
    const errors = validateRecordForm(values);
    expect(errors.ttl).toBeDefined();
  });
});

describe("defaultValuesForType", () => {
  it("seeds sensible defaults for SRV records", () => {
    const values = defaultValuesForType("SRV");
    expect(values.priority).toBe(10);
    expect(values.weight).toBe(1);
    expect(values.port).toBe(443);
  });

  it("seeds sensible defaults for CAA records", () => {
    const values = defaultValuesForType("CAA");
    expect(values.flags).toBe(0);
    expect(values.tag).toBe("issue");
  });

  it("clears type-specific fields when switching types", () => {
    const values = defaultValuesForType("A");
    expect(values.priority).toBeUndefined();
    expect(values.tag).toBeUndefined();
  });
});
