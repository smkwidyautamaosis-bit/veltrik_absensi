const express = require('express');
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getUserRole, 
  updateUserRole 
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'tata_usaha'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

router.route('/:id/role')
  .get(getUserRole)
  .put(updateUserRole);

module.exports = router;
