<template>
  <div class="addressList">
    <address-table 
      @removeGroup="removeGroup" 
      @addTag="addGroup" 
      @addOneAddress="delOneAddress" 
      @addAddress="addOneAddress" 
      :group="groupList"
      :list="addressList"
      class="addressTable">
      </address-table>
  </div>
</template>

<script>
import addressTable from '@/components/address-table'
import { mapActions, mapGetters } from 'vuex'
export default {
  name: 'addressList',
  components: {
    addressTable
  },
  methods: {
    ...mapActions(['addOneAddress', 'delOneAddress', 'addGroup', 'removeGroup'])
  },
  computed: {
    ...mapGetters(['addressList', 'groupList'])
  }
}
</script>

<style>
.addressList {
  width: 100%;
  height: calc(100% - 51px);
  margin-top: 1px;
  box-sizing: border-box;
}
</style>
