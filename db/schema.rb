# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_01_21_181932) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

  create_table "availabilities", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "municipality_id", null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["municipality_id"], name: "index_availabilities_on_municipality_id"
    t.index ["user_id"], name: "index_availabilities_on_user_id"
  end

  create_table "cell_distances", force: :cascade do |t|
    t.bigint "cell_origin_id", null: false
    t.bigint "cell_destiny_id", null: false
    t.float "distance", null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["cell_destiny_id"], name: "index_cell_distances_on_cell_destiny_id"
    t.index ["cell_origin_id", "cell_destiny_id"], name: "index_cell_distances_on_cell_origin_id_and_cell_destiny_id", unique: true
    t.index ["cell_origin_id"], name: "index_cell_distances_on_cell_origin_id"
  end

  create_table "cells", force: :cascade do |t|
    t.bigint "municipality_id", null: false
    t.integer "n_C"
    t.integer "n_I"
    t.integer "n_O"
    t.integer "n_S"
    t.integer "n_E"
    t.integer "n_HG"
    t.integer "n_HM"
    t.integer "n_HP"
    t.integer "n_HD"
    t.integer "m_C"
    t.integer "m_I"
    t.integer "m_O"
    t.integer "m_S"
    t.integer "m_E"
    t.integer "m_HG"
    t.integer "m_HM"
    t.integer "m_HP"
    t.integer "m_HD"
    t.float "acc_C"
    t.float "acc_I"
    t.float "acc_O"
    t.float "acc_S"
    t.float "acc_E"
    t.float "acc_HG"
    t.float "acc_HM"
    t.float "acc_HP"
    t.float "acc_HD"
    t.integer "show_id"
    t.geometry "geometry", limit: {:srid=>4326, :type=>"st_polygon"}, null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["geometry"], name: "index_cells_on_geometry", using: :gist
    t.index ["municipality_id", "show_id"], name: "index_cells_on_municipality_id_and_show_id", unique: true
    t.index ["municipality_id"], name: "index_cells_on_municipality_id"
  end

  create_table "municipalities", force: :cascade do |t|
    t.string "name", null: false
    t.integer "zoom", null: false
    t.geometry "centroid", limit: {:srid=>4326, :type=>"st_point"}, null: false
    t.geometry "geometry", limit: {:srid=>4326, :type=>"multi_polygon"}, null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.integer "municipality_code"
    t.integer "region_code", null: false
    t.index ["centroid"], name: "index_municipalities_on_centroid", using: :gist
    t.index ["geometry"], name: "index_municipalities_on_geometry", using: :gist
    t.index ["region_code"], name: "index_municipalities_on_region_code"
  end

  create_table "projects", force: :cascade do |t|
    t.bigint "scenario_id", null: false
    t.bigint "cell_id", null: false
    t.bigint "use_id", null: false
    t.integer "total_agents"
    t.integer "surface_per_agent"
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["cell_id"], name: "index_projects_on_cell_id"
    t.index ["scenario_id"], name: "index_projects_on_scenario_id"
    t.index ["use_id"], name: "index_projects_on_use_id"
  end

  create_table "regions", force: :cascade do |t|
    t.string "name"
    t.integer "zoom"
    t.geometry "centroid", limit: {:srid=>4326, :type=>"st_point"}, null: false
    t.geometry "geometry", limit: {:srid=>4326, :type=>"multi_polygon"}, null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.integer "region_code", null: false
    t.index ["centroid"], name: "index_regions_on_centroid", using: :gist
    t.index ["geometry"], name: "index_regions_on_geometry", using: :gist
    t.index ["name"], name: "index_regions_on_name", unique: true
    t.index ["region_code"], name: "idx_regions_region_code_unique", unique: true
  end

  create_table "scenario_cells", force: :cascade do |t|
    t.bigint "cell_id", null: false
    t.bigint "base_scenario_id", null: false
    t.integer "n_C_delta"
    t.integer "n_I_delta"
    t.integer "n_O_delta"
    t.integer "n_S_delta"
    t.integer "n_E_delta"
    t.integer "n_HG_delta"
    t.integer "n_HM_delta"
    t.integer "n_HP_delta"
    t.integer "n_HD_delta"
    t.integer "m_C_delta"
    t.integer "m_I_delta"
    t.integer "m_O_delta"
    t.integer "m_S_delta"
    t.integer "m_E_delta"
    t.integer "m_HG_delta"
    t.integer "m_HM_delta"
    t.integer "m_HP_delta"
    t.integer "m_HD_delta"
    t.float "acc_C_delta"
    t.float "acc_I_delta"
    t.float "acc_O_delta"
    t.float "acc_S_delta"
    t.float "acc_E_delta"
    t.float "acc_HG_delta"
    t.float "acc_HM_delta"
    t.float "acc_HP_delta"
    t.float "acc_HD_delta"
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["base_scenario_id"], name: "index_scenario_cells_on_base_scenario_id"
    t.index ["cell_id"], name: "index_scenario_cells_on_cell_id"
  end

  create_table "scenarios", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name"
    t.bigint "municipality_id", null: false
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["municipality_id"], name: "index_scenarios_on_municipality_id"
    t.index ["user_id"], name: "index_scenarios_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "uses", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", default: -> { "now()" }, null: false
    t.datetime "updated_at", default: -> { "now()" }, null: false
    t.string "use_code"
  end

  add_foreign_key "availabilities", "municipalities"
  add_foreign_key "availabilities", "users"
  add_foreign_key "cell_distances", "cells", column: "cell_destiny_id"
  add_foreign_key "cell_distances", "cells", column: "cell_origin_id"
  add_foreign_key "cells", "municipalities"
  add_foreign_key "municipalities", "regions", column: "region_code", primary_key: "region_code", name: "fk_municipalities_region_code"
  add_foreign_key "projects", "cells"
  add_foreign_key "projects", "scenarios"
  add_foreign_key "projects", "uses"
  add_foreign_key "scenario_cells", "cells"
  add_foreign_key "scenario_cells", "scenarios", column: "base_scenario_id"
  add_foreign_key "scenarios", "municipalities"
  add_foreign_key "scenarios", "users"
end
