/**
 * Seed default roles: customer, staff, admin
 */
exports.seed = async function (knex) {
  await knex('roles').del();

  await knex('roles').insert([
    {
      id: 1,
      name: 'customer',
      description: 'Regular customer with shopping privileges',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 2,
      name: 'staff',
      description: 'Staff member with limited admin access',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: 3,
      name: 'admin',
      description: 'Administrator with full system access',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ]);
};
