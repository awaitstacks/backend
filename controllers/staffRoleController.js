import staffModel from "../models/staffProfileModel.js";
import staffRoleModel from "../models/staffRoleModel.js";

// ══════════════════════════════════════════════════════════════════════════════
// STAFF ROLES (Tour Admin / HR side) — authTour protected
// Role = team name + tabs. Username/password Staff Profile form la (staffController)
// ══════════════════════════════════════════════════════════════════════════════

// Tabs list ah clean pannum — duplicate, empty values remove
const cleanTabs = (tabs) => {
  let list = tabs;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      list = list.split(",");
    }
  }
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((t) => String(t).trim()).filter(Boolean))];
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/tour/staff-roles   → ella roles + ovvonnula ethana staff
// ──────────────────────────────────────────────────────────────────────────────
const getRoles = async (req, res) => {
  try {
    const roles = await staffRoleModel
      .find()
      .collation({ locale: "en", strength: 2 })
      .sort({ name: 1 })
      .lean();

    const counts = await staffModel.aggregate([
      { $match: { role: { $ne: null } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    return res.status(200).json({
      success: true,
      data: roles.map((r) => ({ ...r, staffCount: countMap[String(r._id)] || 0 })),
    });
  } catch (error) {
    console.error("getRoles error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/tour/staff-roles   { name, description, tabs: [...] }
// ──────────────────────────────────────────────────────────────────────────────
const createRole = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Role name is required", errors: { name: "Required" } });
    }

    const role = await staffRoleModel.create({
      name,
      description: String(req.body.description || "").trim(),
      tabs: cleanTabs(req.body.tabs),
    });

    return res.status(201).json({ success: true, message: "Role created", data: role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "A role with this name already exists", errors: { name: "Already exists" } });
    }
    console.error("createRole error:", error);
    return res.status(500).json({ success: false, message: "Failed to create role", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/tour/staff-roles/:id   { name?, description?, tabs? }
// Tabs maathina, indha role la irukura ellaa staff kum automatic ah maarum
// ──────────────────────────────────────────────────────────────────────────────
const updateRole = async (req, res) => {
  try {
    const role = await staffRoleModel.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: "Role not found" });

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) {
        return res.status(400).json({ success: false, message: "Role name is required", errors: { name: "Required" } });
      }
      role.name = name;
    }
    if (req.body.description !== undefined) role.description = String(req.body.description).trim();
    if (req.body.tabs !== undefined) role.tabs = cleanTabs(req.body.tabs);

    await role.save();
    return res.status(200).json({ success: true, message: "Role updated", data: role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "A role with this name already exists", errors: { name: "Already exists" } });
    }
    console.error("updateRole error:", error);
    return res.status(500).json({ success: false, message: "Failed to update role", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/tour/staff-roles/:id
// Staff yaaraavadhu indha role la irundha delete panna vidaadhu
// ──────────────────────────────────────────────────────────────────────────────
const deleteRole = async (req, res) => {
  try {
    const inUse = await staffModel.countDocuments({ role: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `${inUse} staff ${inUse === 1 ? "is" : "are"} using this role. Move them to another role first.`,
      });
    }

    const role = await staffRoleModel.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: "Role not found" });

    return res.status(200).json({ success: true, message: "Role deleted" });
  } catch (error) {
    console.error("deleteRole error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete role", error: error.message });
  }
};

export { getRoles, createRole, updateRole, deleteRole };