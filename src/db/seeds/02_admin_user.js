/**
 * Seed default admin user for development
 */
const bcrypt = require('bcrypt');

exports.seed = async function (knex) {
  await knex('users').where({ email: 'admin@example.com' }).del();

  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  const [userId] = await knex('users')
    .insert({
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      is_active: true,
      email_verified: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .returning('id');

  const resolvedUserId = typeof userId === 'object' ? userId.id : userId;

  const adminRole = await knex('roles').where({ name: 'admin' }).first();

  await knex('user_roles')
    .where({ user_id: resolvedUserId })
    .del();

  await knex('user_roles').insert({
    user_id: resolvedUserId,
    role_id: adminRole.id,
    created_at: knex.fn.now(),
  });
};
