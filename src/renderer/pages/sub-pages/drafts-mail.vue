<template>
  <div class="drafts">
    <letter-table :data="draftMail" type="out"></letter-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import letterTable from '@/components/letter-table'
export default {
  name: 'drafts',
  computed: {
    ...mapGetters(['draftMail'])
  },
  components: {
    letterTable
  }
}
</script>

<style>
.drafts {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
table {
  width: 100%;
  color: #545454;
}
table thead {
  line-height: 40px;
  height: 40px;
  border-bottom: 1px solid #ebeef5;
}
table tbody tr {
  line-height: 30px;
  height: 30px;
  border-bottom: 1px solid #ebeef5;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
table thead tr th, table tbody tr th{
  text-align: center;
}
</style>
